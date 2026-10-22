//! The `Selection` handle an app keeps per document, and the `SelectionScope` element that wraps
//! the document: it collects the blocks each render, owns the pointer and touch listeners, and
//! draws the touch handles and the Copy pill.

use std::cell::RefCell;
use std::rc::{Rc, Weak};

use gpui::prelude::*;
use gpui::{
    AnyElement, App, AvailableSpace, Bounds, ClipboardItem, DispatchPhase, Element, EntityId,
    GlobalElementId, Hitbox, HitboxBehavior, Hsla, InspectorElementId, LayoutId, LongPressEvent,
    MouseButton, MouseDownEvent, MouseMoveEvent, MouseUpEvent, Pixels, Point, SharedString,
    StyledText, TouchDragEvent, TouchPhase, Window, div, fill, point, px, size,
};

use super::element::Selectable;
use super::gesture::{Effects, End, Gesture, Input, step};
use super::model::{Ordinal, Origin, Span, effective_click_count};
use super::registry::{Hit, Live, Registry};

/// Colours the app supplies: a selection colour is a theme decision.
#[derive(Clone)]
pub struct SelectionStyle {
    pub highlight: Hsla,
    pub handle: Hsla,
    pub pill_bg: Hsla,
    pub pill_fg: Hsla,
    pub copy_label: SharedString,
}

/// A touch handle's knob radius, and how far above a finger on a knob the text is sampled.
const KNOB: Pixels = px(7.);
const HANDLE_LIFT: Pixels = px(22.);
/// A finger-sized square round each knob.
const HANDLE_HIT: Pixels = px(44.);
/// How far above the selection's first line the Copy pill sits.
pub(super) const PILL_LIFT: Pixels = px(40.);

pub(super) struct ScopeState {
    key: Option<SharedString>,
    pub registry: Registry<Live>,
    pub selection: Option<Span>,
    gesture: Gesture,
    pub style: Option<SelectionStyle>,
    last_click: Option<Point<Pixels>>,
    /// the views whose paint drew a block: who to notify when the selection changes
    pub views: Vec<EntityId>,
    handles: [Option<Hitbox>; 2],
}

impl ScopeState {
    fn step(&mut self, input: Input) -> Effects {
        step(&mut self.gesture, &mut self.selection, input)
    }

    /// The press landed on this block, and nothing drawn over the page covers it there.
    fn press_hit(&self, p: Point<Pixels>, window: &Window) -> Option<Hit> {
        let i = self
            .registry
            .blocks()
            .iter()
            .position(|b| b.hitbox.as_ref().is_some_and(|h| h.is_hovered(window)))?;
        Some(self.registry.hit(Ordinal(i as u32), p))
    }

    fn nearest_hit(&self, p: Point<Pixels>) -> Option<Hit> {
        let o = self.registry.nearest(p)?;
        Some(self.registry.hit(o, p))
    }

    /// The handle under the finger. Round a short selection both finger-sized hitboxes overlap,
    /// so the nearer knob wins.
    fn handle_under(&self, window: &Window) -> Option<End> {
        let at = window.mouse_position();
        let distance = |h: &Hitbox| {
            let c = h.bounds.center();
            f32::from(c.x - at.x).powi(2) + f32::from(c.y - at.y).powi(2)
        };
        [End::Start, End::End]
            .into_iter()
            .zip(&self.handles)
            .filter_map(|(end, h)| {
                h.as_ref()
                    .filter(|h| h.is_hovered(window))
                    .map(|h| (end, h))
            })
            .min_by(|a, b| distance(a.1).total_cmp(&distance(b.1)))
            .map(|(end, _)| end)
    }

    fn touch_selection(&self) -> Option<&Span> {
        self.selection
            .as_ref()
            .filter(|s| s.origin == Origin::Touch && !s.is_empty())
    }
}

/// One selection per document. A cheap handle: keep it in the view that renders the document.
#[derive(Clone)]
pub struct Selection(pub(super) Rc<RefCell<ScopeState>>);

thread_local! {
    static SCOPES: RefCell<Vec<Weak<RefCell<ScopeState>>>> = const { RefCell::new(Vec::new()) };
    /// the scope whose children are prepainting right now
    static CURRENT: RefCell<Option<Selection>> = const { RefCell::new(None) };
}

impl Default for Selection {
    fn default() -> Self {
        Self::new()
    }
}

impl Selection {
    pub fn new() -> Self {
        let state = Rc::new(RefCell::new(ScopeState {
            key: None,
            registry: Registry::default(),
            selection: None,
            gesture: Gesture::Idle,
            style: None,
            last_click: None,
            views: Vec::new(),
            handles: [None, None],
        }));
        SCOPES.with(|s| {
            let mut s = s.borrow_mut();
            s.retain(|w| w.strong_count() > 0);
            s.push(Rc::downgrade(&state));
        });
        Self(state)
    }

    /// Wraps a document. A changed `key` clears the selection: pass what identifies the content.
    pub fn scope(
        &self,
        key: impl Into<SharedString>,
        child: impl IntoElement,
        style: SelectionStyle,
    ) -> SelectionScope {
        SelectionScope {
            state: self.clone(),
            key: key.into(),
            child: child.into_any_element(),
            style,
        }
    }

    pub fn text(&self, text: impl Into<SharedString>) -> Selectable {
        Selectable::new(StyledText::new(text))
    }

    pub fn styled(&self, text: StyledText) -> Selectable {
        Selectable::new(text)
    }

    pub fn selected_text(&self) -> Option<String> {
        let s = self.0.borrow();
        let span = s.selection.as_ref().filter(|s| !s.is_empty())?;
        Some(s.registry.text(span))
    }

    /// The highlight rects of the selection, in window coordinates, in document order.
    pub fn rects(&self) -> Vec<Bounds<Pixels>> {
        let s = self.0.borrow();
        match s.selection.as_ref().filter(|s| !s.is_empty()) {
            Some(span) => s.registry.span_rects(span),
            None => Vec::new(),
        }
    }

    pub fn clear(&self, cx: &mut App) {
        let views = {
            let mut s = self.0.borrow_mut();
            if s.selection.take().is_none() {
                return;
            }
            s.gesture = Gesture::Idle;
            s.views.clone()
        };
        for v in views {
            cx.notify(v);
        }
    }

    /// The scope whose children are prepainting right now.
    pub(super) fn current() -> Option<Selection> {
        CURRENT.with(|c| c.borrow().clone())
    }

    /// The scope a keystroke or a copy command belongs to: the one with a selection, else the
    /// one with a document in it.
    pub(super) fn active() -> Option<Selection> {
        let live: Vec<Selection> = SCOPES.with(|s| {
            s.borrow()
                .iter()
                .filter_map(|w| w.upgrade().map(Selection))
                .collect()
        });
        live.iter()
            .find(|s| s.0.borrow().selection.is_some_and(|sp| !sp.is_empty()))
            .or_else(|| live.iter().find(|s| !s.0.borrow().registry.is_empty()))
            .cloned()
    }

    pub(super) fn key(&self, input: Input, window: &mut Window, cx: &mut App) {
        let fx = {
            let mut s = self.0.borrow_mut();
            let input = match input {
                Input::SelectAll { .. } => Input::SelectAll {
                    whole: s.registry.whole(),
                },
                other => other,
            };
            s.step(input)
        };
        if fx.consume {
            cx.stop_propagation();
        }
        self.apply(fx, window, cx);
    }

    /// The state borrow is dropped before this runs: links, notifications and the clipboard
    /// may all re-enter the scope.
    fn apply(&self, fx: Effects, window: &mut Window, cx: &mut App) {
        if fx.claim {
            window.prevent_default();
        }
        if fx.changed {
            let views = self.0.borrow().views.clone();
            for v in views {
                cx.notify(v);
            }
        }
        if fx.copy
            && let Some(text) = self.selected_text()
        {
            cx.write_to_clipboard(ClipboardItem::new_string(text));
        }
        if let Some((block, link)) = fx.link {
            let on_link = self
                .0
                .borrow()
                .registry
                .get(block)
                .and_then(|b| b.on_link.clone());
            if let Some(on_link) = on_link {
                on_link(link, window, cx);
            }
        }
    }

    fn mouse<E, F>(&self, window: &mut Window, build: F)
    where
        E: gpui::MouseEvent,
        F: Fn(&mut ScopeState, &E, &Window) -> Option<Input> + 'static,
    {
        let state = self.clone();
        window.on_mouse_event(move |e: &E, phase, window, cx| {
            if phase != DispatchPhase::Bubble {
                return;
            }
            let fx = {
                let mut s = state.0.borrow_mut();
                let Some(input) = build(&mut s, e, window) else {
                    return;
                };
                s.step(input)
            };
            state.apply(fx, window, cx);
        });
    }
}

pub struct SelectionScope {
    state: Selection,
    key: SharedString,
    child: AnyElement,
    style: SelectionStyle,
}

pub struct ScopePrepaint {
    /// the touch handles' stems and knobs, start then end
    handles: Option<[(Bounds<Pixels>, Bounds<Pixels>); 2]>,
}

impl SelectionScope {
    fn pill(&self) -> AnyElement {
        let state = self.state.clone();
        let style = &self.style;
        div()
            .id("select:copy")
            .px(px(14.))
            .py(px(6.))
            .rounded(px(16.))
            .bg(style.pill_bg)
            .text_color(style.pill_fg)
            .text_size(px(14.))
            .line_height(px(20.))
            .cursor_pointer()
            .child(style.copy_label.clone())
            .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
            .on_click(move |_, window, cx| {
                let fx = state.0.borrow_mut().step(Input::Copy);
                state.apply(fx, window, cx);
                state.clear(cx);
            })
            .into_any_element()
    }
}

impl Element for SelectionScope {
    type RequestLayoutState = ();
    type PrepaintState = ScopePrepaint;

    fn id(&self) -> Option<gpui::ElementId> {
        None
    }

    fn source_location(&self) -> Option<&'static std::panic::Location<'static>> {
        None
    }

    fn request_layout(
        &mut self,
        _: Option<&GlobalElementId>,
        _: Option<&InspectorElementId>,
        window: &mut Window,
        cx: &mut App,
    ) -> (LayoutId, ()) {
        (self.child.request_layout(window, cx), ())
    }

    fn prepaint(
        &mut self,
        _: Option<&GlobalElementId>,
        _: Option<&InspectorElementId>,
        _: Bounds<Pixels>,
        _: &mut (),
        window: &mut Window,
        cx: &mut App,
    ) -> ScopePrepaint {
        {
            let mut s = self.state.0.borrow_mut();
            if s.key.as_ref() != Some(&self.key) {
                s.key = Some(self.key.clone());
                s.selection = None;
                s.gesture = Gesture::Idle;
            }
            s.style = Some(self.style.clone());
            s.views.clear();
            s.registry.begin();
        }
        CURRENT.with(|c| *c.borrow_mut() = Some(self.state.clone()));
        self.child.prepaint(window, cx);
        CURRENT.with(|c| *c.borrow_mut() = None);

        let mut s = self.state.0.borrow_mut();
        let selection = s.selection;
        if !s.registry.commit(selection.as_ref()) {
            s.selection = None;
            s.gesture = Gesture::Idle;
        }
        s.handles = [None, None];
        let Some(span) = s.touch_selection() else {
            return ScopePrepaint { handles: None };
        };
        let rects = s.registry.span_rects(span);
        let (Some(first), Some(last)) = (rects.first(), rects.last()) else {
            return ScopePrepaint { handles: None };
        };
        let handle = |x: Pixels, r: &Bounds<Pixels>| {
            let stem = Bounds::new(point(x - px(1.), r.top()), size(px(2.), r.size.height));
            let knob = Bounds::new(point(x - KNOB, r.bottom()), size(KNOB * 2., KNOB * 2.));
            (stem, knob)
        };
        let handles = [handle(first.left(), first), handle(last.right(), last)];
        for (i, (_, knob)) in handles.iter().enumerate() {
            let hit = Bounds::centered_at(knob.center(), size(HANDLE_HIT, HANDLE_HIT));
            s.handles[i] = Some(window.insert_hitbox(hit, HitboxBehavior::Normal));
        }
        let pill_at = point(first.left(), first.top() - PILL_LIFT);
        drop(s);
        // a deferred element is prepainted where it is drawn, but laid out here
        let mut pill = self.pill();
        pill.layout_as_root(
            size(AvailableSpace::MaxContent, AvailableSpace::MaxContent),
            window,
            cx,
        );
        window.defer_draw(pill, pill_at, 1, Some(window.content_mask()));
        ScopePrepaint {
            handles: Some(handles),
        }
    }

    fn paint(
        &mut self,
        _: Option<&GlobalElementId>,
        _: Option<&InspectorElementId>,
        _: Bounds<Pixels>,
        _: &mut (),
        prepaint: &mut ScopePrepaint,
        window: &mut Window,
        cx: &mut App,
    ) {
        self.child.paint(window, cx);
        if let Some(handles) = &prepaint.handles {
            for (stem, knob) in handles {
                window.paint_quad(fill(*stem, self.style.handle));
                window.paint_quad(fill(*knob, self.style.handle).corner_radii(KNOB));
            }
        }

        let state = &self.state;
        state.mouse(window, |s, e: &MouseDownEvent, window| {
            if s.handle_under(window).is_some() {
                return None;
            }
            let clicks = effective_click_count(e.click_count, e.position, s.last_click);
            s.last_click = Some(e.position);
            Some(Input::Down {
                at: e.position,
                button: e.button,
                clicks,
                shift: e.modifiers.shift,
                hit: s.press_hit(e.position, window),
            })
        });
        state.mouse(window, |s, e: &MouseMoveEvent, _| {
            matches!(s.gesture, Gesture::Pressed { .. }).then(|| Input::Move {
                at: e.position,
                hit: s.nearest_hit(e.position),
            })
        });
        state.mouse(window, |s, e: &MouseUpEvent, window| {
            let hit = match s.gesture {
                Gesture::Pressed {
                    dragging: false, ..
                } => s.press_hit(e.position, window),
                _ => None,
            };
            Some(Input::Up { hit })
        });
        state.mouse(window, |s, e: &LongPressEvent, window| {
            let hit = match e.phase {
                TouchPhase::Started => s.press_hit(e.start_position, window),
                _ => s.nearest_hit(e.position),
            };
            Some(Input::LongPress {
                phase: e.phase,
                hit,
            })
        });
        state.mouse(window, |s, e: &TouchDragEvent, window| {
            let end = (e.phase == TouchPhase::Started)
                .then(|| s.handle_under(window))
                .flatten();
            // the finger sits on the knob under the line: sample the text above it
            let at = point(e.position.x, e.position.y - HANDLE_LIFT);
            Some(Input::HandleDrag {
                phase: e.phase,
                end,
                hit: s.nearest_hit(at),
            })
        });
    }
}

impl IntoElement for SelectionScope {
    type Element = Self;

    fn into_element(self) -> Self {
        self
    }
}
