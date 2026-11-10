use std::cell::RefCell;
use std::rc::{Rc, Weak};

use gpui::prelude::*;
use gpui::{
    AnyElement, App, AvailableSpace, Bounds, ClipboardItem, DispatchPhase, Element, EntityId,
    GlobalElementId, Hitbox, HitboxBehavior, Hsla, InspectorElementId, LayoutId, LongPressEvent,
    MouseButton, MouseDownEvent, MouseMoveEvent, MouseUpEvent, PaintQuad, Pixels, Point,
    SharedString, StyledText, TouchDragEvent, TouchPhase, Window, div, point, px, size,
};

use super::element::Selectable;
use super::gesture::{Effects, End, Gesture, Input, step};
use super::model::{Ordinal, Origin, Span, effective_click_count};
use super::registry::{Hit, Live, Registry};

#[derive(Clone)]
pub struct SelectionStyle {
    pub highlight: Hsla,
    pub handle: Hsla,
    pub pill_bg: Hsla,
    pub pill_fg: Hsla,
    pub copy_label: SharedString,
}

const KNOB: Pixels = px(7.);
const HANDLE_LIFT: Pixels = px(22.);
const HANDLE_HIT: Pixels = px(44.);
const PILL_LIFT: Pixels = px(40.);
const PILL_DROP: Pixels = px(22.);

pub(super) struct ScopeState {
    key: Option<SharedString>,
    pub registry: Registry<Live>,
    pub selection: Option<Span>,
    gesture: Gesture,
    pub style: Option<SelectionStyle>,
    last_click: Option<Point<Pixels>>,
    pub views: Vec<EntityId>,
    handles: [Option<Hitbox>; 2],
    pub pill: Option<Point<Pixels>>,
}

impl ScopeState {
    fn step(&mut self, input: Input) -> Effects {
        step(&mut self.gesture, &mut self.selection, input)
    }

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

#[derive(Clone)]
pub struct Selection(pub(super) Rc<RefCell<ScopeState>>);

thread_local! {
    static SCOPES: RefCell<Vec<Weak<RefCell<ScopeState>>>> = const { RefCell::new(Vec::new()) };
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
            pill: None,
        }));
        SCOPES.with(|s| {
            let mut s = s.borrow_mut();
            s.retain(|w| w.strong_count() > 0);
            s.push(Rc::downgrade(&state));
        });
        Self(state)
    }

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
            clearance: px(0.),
        }
    }

    pub fn text(&self, text: impl Into<SharedString>) -> Selectable {
        let text = text.into();
        Selectable::new(StyledText::new(text.clone()), Some(text))
    }

    pub fn styled(&self, text: StyledText) -> Selectable {
        Selectable::new(text, None)
    }

    pub fn selected_text(&self) -> Option<String> {
        let s = self.0.borrow();
        let span = s.selection.as_ref().filter(|s| !s.is_empty())?;
        Some(s.registry.text(span))
    }

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

    pub fn reset(&self, cx: &mut App) {
        {
            let mut s = self.0.borrow_mut();
            if s.registry.is_empty() && s.selection.is_none() {
                return;
            }
            s.registry = Registry::default();
            s.gesture = Gesture::Idle;
            s.handles = [None, None];
            s.pill = None;
        }
        self.clear(cx);
    }

    pub(super) fn pill(&self) -> Option<Point<Pixels>> {
        self.0.borrow().pill
    }

    pub(super) fn current() -> Option<Selection> {
        CURRENT.with(|c| c.borrow().clone())
    }

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
        self.apply(fx, window, cx);
    }

    fn apply(&self, fx: Effects, window: &mut Window, cx: &mut App) {
        if fx.claim {
            window.prevent_default();
        }
        if fx.consume {
            cx.stop_propagation();
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
            write_clipboard(text, cx);
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

fn write_clipboard(text: String, cx: &mut App) {
    #[cfg(target_family = "wasm")]
    if !super::web::has_clipboard_api() {
        super::web::copy_by_command();
        return;
    }
    cx.write_to_clipboard(ClipboardItem::new_string(text));
}

pub struct SelectionScope {
    state: Selection,
    key: SharedString,
    child: AnyElement,
    style: SelectionStyle,
    clearance: Pixels,
}

pub struct ScopePrepaint {
    handles: Option<[(Bounds<Pixels>, Bounds<Pixels>); 2]>,
}

impl SelectionScope {
    pub fn pill_clearance(mut self, top: Pixels) -> Self {
        self.clearance = top;
        self
    }

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
        s.pill = None;
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
        let (first, last) = (*first, *last);
        drop(s);
        let mut pill = self.pill();
        let pill_size = pill.layout_as_root(
            size(AvailableSpace::MaxContent, AvailableSpace::MaxContent),
            window,
            cx,
        );
        let viewport = window.viewport_size();
        let above = first.top() - PILL_LIFT;
        let below = last.bottom() + PILL_DROP;
        let (y, beside) = if above >= self.clearance {
            (above, first)
        } else if below + pill_size.height <= viewport.height {
            (below, last)
        } else {
            (self.clearance, first)
        };
        let x = beside
            .left()
            .min(viewport.width - pill_size.width)
            .max(px(0.));
        let pill_at = point(x, y);
        self.state.0.borrow_mut().pill = Some(pill_at);
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
                window.paint_quad(PaintQuad::new(*stem).background(self.style.handle));
                window.paint_quad(
                    PaintQuad::new(*knob)
                        .background(self.style.handle)
                        .corner_radii(KNOB),
                );
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
                held: e.pressed_button == Some(MouseButton::Left),
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
