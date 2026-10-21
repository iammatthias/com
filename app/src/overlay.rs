//! What is drawn over something else: where an element was painted (a `Probe`, read by the plate
//! under it), and for what the browser draws over the canvas (clips in dom_video, components in
//! dom_embed, Find's input in dom_input) where it sits and whether anything on the canvas is in
//! front of the page, in which case none of them may show (they'd sit on top of it, and can't
//! fade with it).

use std::cell::Cell;
use std::rc::Rc;

use gpui::prelude::*;
use gpui::{Bounds, Pixels, div};

/// A rectangle in CSS pixels, relative to the viewport.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl Rect {
    pub fn from_bounds(b: gpui::Bounds<gpui::Pixels>) -> Self {
        Self {
            x: b.origin.x.into(),
            y: b.origin.y.into(),
            w: b.size.width.into(),
            h: b.size.height.into(),
        }
    }

    fn bottom(&self) -> f32 {
        self.y + self.h
    }

    fn right(&self) -> f32 {
        self.x + self.w
    }

    /// `clip-path: inset(...)` that cuts `self` down to `clip`, or `None` if nothing is left.
    pub fn inset_within(&self, clip: &Rect) -> Option<[f32; 4]> {
        let top = (clip.y - self.y).max(0.);
        let left = (clip.x - self.x).max(0.);
        let bottom = (self.bottom() - clip.bottom()).max(0.);
        let right = (self.right() - clip.right()).max(0.);
        (top + bottom < self.h && left + right < self.w).then_some([top, right, bottom, left])
    }

    /// The share of `self` that lies inside `clip`, 0..1.
    pub fn visible_ratio(&self, clip: &Rect) -> f32 {
        let w = (self.right().min(clip.right()) - self.x.max(clip.x)).max(0.);
        let h = (self.bottom().min(clip.bottom()) - self.y.max(clip.y)).max(0.);
        if self.w <= 0. || self.h <= 0. {
            0.
        } else {
            (w * h) / (self.w * self.h)
        }
    }
}

/// How a probe asks for the frame that catches up with an element that moved.
#[derive(Clone, Copy)]
pub enum Redraw {
    /// Notify the view the probe is painted in, next frame.
    NextFrame,
    /// Refresh the whole window, next frame.
    Refresh,
}

/// Records where an element was painted: the plate frames a page's column by one and draws a
/// control's pane of glass by another, and a panel measures its body with one.
#[derive(Clone, Default)]
pub struct Probe(Rc<Cell<Option<Bounds<Pixels>>>>);

impl Probe {
    /// An invisible element filling its parent that reports the parent's painted bounds. What
    /// reads them was drawn before this paints, so when they move another frame is asked for in
    /// which the reader catches up: without it, it would lag a step until something else redrew.
    pub fn element(&self, redraw: Redraw) -> impl IntoElement {
        let cell = self.0.clone();
        div().absolute().inset_0().child(
            gpui::canvas(
                move |bounds, window, _| {
                    if cell.replace(Some(bounds)) != Some(bounds) {
                        match redraw {
                            Redraw::NextFrame => window.request_animation_frame(),
                            Redraw::Refresh => window.on_next_frame(|window, _| window.refresh()),
                        }
                    }
                },
                |_, _, _, _| {},
            )
            .size_full(),
        )
    }

    /// Where the element was last painted.
    pub fn bounds(&self) -> Option<Bounds<Pixels>> {
        self.0.get()
    }

    pub fn size(&self) -> Option<gpui::Size<Pixels>> {
        self.0.get().map(|b| b.size)
    }

    /// Place it directly, ahead of the probe (a control whose shape is animating: the plate draws
    /// this frame's shape, not last frame's).
    pub fn set(&self, bounds: Bounds<Pixels>) {
        self.0.set(Some(bounds));
    }

    /// Not on screen this frame.
    pub fn clear(&self) {
        self.0.set(None);
    }
}

thread_local! {
    static LIGHTBOX: Cell<bool> = const { Cell::new(false) };
    static PANEL: Cell<bool> = const { Cell::new(false) };
    static PAGE_SHOWN: Cell<bool> = const { Cell::new(true) };
}

/// The lightbox is over the page.
pub fn set_lightbox(on: bool) {
    LIGHTBOX.set(on);
}

/// A corner panel is open (or opening, or closing) over the page. True when that changed.
pub fn set_panel(on: bool) -> bool {
    PANEL.replace(on) != on
}

/// The page's text is up (it fades in once the frame has opened round it).
pub fn set_page_shown(on: bool) {
    PAGE_SHOWN.set(on);
}

/// Something is in front of the page, or the page isn't up yet: page overlays stay hidden.
pub fn blocked() -> bool {
    LIGHTBOX.get() || PANEL.get() || !PAGE_SHOWN.get()
}

/// The lightbox covers everything, the panels' own overlays (Find's input) included.
pub fn lightbox_open() -> bool {
    LIGHTBOX.get()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn insets() {
        let clip = Rect {
            x: 0.,
            y: 0.,
            w: 1000.,
            h: 800.,
        };
        let r = Rect {
            x: 100.,
            y: -50.,
            w: 400.,
            h: 300.,
        };
        assert_eq!(r.inset_within(&clip), Some([50., 0., 0., 0.]));
        let below = Rect {
            x: 100.,
            y: 900.,
            w: 400.,
            h: 300.,
        };
        assert_eq!(below.inset_within(&clip), None);
        assert!((r.visible_ratio(&clip) - 250. / 300.).abs() < 1e-5);
    }
}
