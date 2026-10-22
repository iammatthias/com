//! One selectable block: a `StyledText` in a layout node of its own, so its `TextLayout` is
//! measured and prepainted (a text child of a block div is folded into the parent's inline
//! paragraph and never gets bounds). It paints its own highlight under its glyphs and owns
//! its links, so a click and a drag have one owner.

use std::cell::Cell;
use std::ops::Range;
use std::rc::Rc;

use gpui::{
    AnyElement, App, Bounds, CursorStyle, DispatchPhase, Display, Element, GlobalElementId, Hitbox,
    HitboxBehavior, InspectorElementId, IntoElement, LayoutId, MouseMoveEvent, Pixels,
    SharedString, Style, StyledText, TextLayout, Window, fill,
};

use super::model::{Fingerprint, Join, Ordinal};
use super::registry::{Block, Live, OnLink};
use super::scope::Selection;

type OnLinkHover = Rc<dyn Fn(Option<usize>, &mut Window, &mut App)>;

pub struct Selectable {
    layout: TextLayout,
    text: AnyElement,
    links: Rc<[Range<usize>]>,
    on_link: Option<OnLink>,
    on_link_hover: Option<OnLinkHover>,
    join: Join,
    source: Option<SharedString>,
}

pub struct Prepainted {
    ordinal: Option<Ordinal>,
    scope: Option<Selection>,
    hitbox: Hitbox,
    /// one hitbox per visual line of each link
    links: Vec<(usize, Hitbox)>,
}

impl Selectable {
    pub(super) fn new(text: StyledText, source: Option<SharedString>) -> Self {
        Self {
            source,
            layout: text.layout().clone(),
            text: text.into_any_element(),
            links: Rc::from(Vec::new()),
            on_link: None,
            on_link_hover: None,
            join: Join::default(),
        }
    }

    /// `ranges` are byte ranges of the text. A click (press and release without a drag) in one
    /// calls `f` with its index; a drag that starts on one selects.
    pub fn links(
        mut self,
        ranges: Vec<Range<usize>>,
        f: impl Fn(usize, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.links = ranges.into();
        self.on_link = Some(Rc::new(f));
        self
    }

    /// `Some(index)` when the pointer enters a link, `None` when it leaves.
    pub fn on_link_hover(
        mut self,
        f: impl Fn(Option<usize>, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_link_hover = Some(Rc::new(f));
        self
    }

    /// What copied text puts between this block and the one before it.
    pub fn join(mut self, join: Join) -> Self {
        self.join = join;
        self
    }
}

impl Element for Selectable {
    type RequestLayoutState = ();
    type PrepaintState = Prepainted;

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
        let text = self.text.request_layout(window, cx);
        // a block node with no inline content of its own: the parent's paragraph collector
        // takes it as a flow child and never folds the text beneath into its own paragraph
        let style = Style {
            display: Display::Block,
            ..Default::default()
        };
        (window.request_layout(style, [text], cx), ())
    }

    fn prepaint(
        &mut self,
        _: Option<&GlobalElementId>,
        _: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        _: &mut (),
        window: &mut Window,
        cx: &mut App,
    ) -> Prepainted {
        self.text.prepaint(window, cx);
        let hitbox = window.insert_hitbox(bounds, HitboxBehavior::Normal);
        let live = Live {
            layout: self.layout.clone(),
            bounds: self.layout.bounds(),
        };
        let mut links = Vec::new();
        for (i, range) in self.links.iter().enumerate() {
            for rect in super::registry::BlockGeometry::rects(&live, range.clone()) {
                links.push((i, window.insert_hitbox(rect, HitboxBehavior::Normal)));
            }
        }
        let scope = Selection::current();
        let ordinal = scope.as_ref().and_then(|scope| {
            scope.0.borrow_mut().registry.push(Block {
                fingerprint: Fingerprint::of(&live.layout.text()),
                geometry: live,
                join: self.join,
                links: self.links.clone(),
                on_link: self.on_link.clone(),
                source: self.source.clone(),
                hitbox: Some(hitbox.clone()),
            })
        });
        Prepainted {
            ordinal,
            scope,
            hitbox,
            links,
        }
    }

    fn paint(
        &mut self,
        _: Option<&GlobalElementId>,
        _: Option<&InspectorElementId>,
        _: Bounds<Pixels>,
        _: &mut (),
        prepaint: &mut Prepainted,
        window: &mut Window,
        cx: &mut App,
    ) {
        if let (Some(scope), Some(ordinal)) = (&prepaint.scope, prepaint.ordinal) {
            let mut s = scope.0.borrow_mut();
            let view = window.current_view();
            if !s.views.contains(&view) {
                s.views.push(view);
            }
            if let (Some(sel), Some(style)) = (&s.selection, &s.style)
                && let Some(range) = sel.range_in(ordinal, self.layout.len())
            {
                for rect in s.registry.rects(ordinal, range) {
                    window.paint_quad(fill(rect, style.highlight));
                }
            }
        }
        self.text.paint(window, cx);
        // the later request wins: links over the block's I-beam
        window.set_cursor_style(CursorStyle::IBeam, &prepaint.hitbox);
        for (_, hitbox) in &prepaint.links {
            window.set_cursor_style(CursorStyle::PointingHand, hitbox);
        }
        if let Some(on_hover) = self.on_link_hover.take() {
            let hitbox = prepaint.hitbox.clone();
            let links = std::mem::take(&mut prepaint.links);
            let hovered: Cell<Option<usize>> = Cell::new(None);
            window.on_mouse_event(move |_: &MouseMoveEvent, phase, window, cx| {
                if phase != DispatchPhase::Bubble {
                    return;
                }
                let now = hitbox.is_hovered(window).then(|| {
                    links
                        .iter()
                        .find(|(_, h)| h.is_hovered(window))
                        .map(|(i, _)| *i)
                });
                let now = now.flatten();
                if now != hovered.get() {
                    hovered.set(now);
                    on_hover(now, window, cx);
                }
            });
        }
    }
}

impl IntoElement for Selectable {
    type Element = Self;

    fn into_element(self) -> Self {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui::{ParentElement, Styled, TestAppContext, div, point, px, size};

    const TEXT: &str = "Measure these words across a narrow column of text that wraps";

    #[gpui::test]
    fn a_selectable_in_a_div_has_live_bounds_and_selection_rects(cx: &mut TestAppContext) {
        let cx = cx.add_empty_window();
        let text = StyledText::new(TEXT);
        let layout = text.layout().clone();
        cx.draw(point(px(0.), px(0.)), size(px(200.), px(300.)), |_, _| {
            div().w(px(200.)).child(Selectable::new(text, None))
        });
        let bounds = layout.bounds();
        assert!(bounds.size.width > px(0.));
        // the test text system shapes widths but never wraps: wrapping is probe 2, on screen
        assert_eq!(bounds.size, size(px(200.), layout.line_height()));
        let rects = layout.line_layouts()[0].selection_bounds(0..TEXT.len(), layout.line_height());
        assert_eq!(rects.len(), 1, "{rects:?}");
        assert!(rects.iter().all(|r| r.size.width > px(0.)));
    }

    #[gpui::test]
    fn a_bare_styled_text_in_a_div_has_no_bounds(cx: &mut TestAppContext) {
        let cx = cx.add_empty_window();
        let text = StyledText::new(TEXT);
        let layout = text.layout().clone();
        cx.draw(point(px(0.), px(0.)), size(px(200.), px(300.)), |_, _| {
            div().w(px(200.)).child(text)
        });
        let panicked = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| layout.bounds()));
        assert!(
            panicked.is_err(),
            "a text child of a block div is folded into its paragraph"
        );
    }
}
