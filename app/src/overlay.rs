//! What is drawn over something else: where an element was painted (a `Probe`, read by the plate
//! under it), and for what the browser draws over the canvas (clips in dom_video, components in
//! dom_embed, Find's input in dom_input) where it sits and whether anything on the canvas is in
//! front of the page, in which case none of them may show (they'd sit on top of it, and can't
//! fade with it).

use std::cell::Cell;
use std::collections::HashMap;
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
    if LIGHTBOX.replace(on) != on {
        crate::dom_video::wake();
    }
}

/// A corner panel is open (or opening, or closing) over the page. True when that changed.
pub fn set_panel(on: bool) -> bool {
    let changed = PANEL.replace(on) != on;
    if changed {
        crate::dom_video::wake();
    }
    changed
}

/// The page's text is up (it fades in once the frame has opened round it).
pub fn set_page_shown(on: bool) {
    if PAGE_SHOWN.replace(on) != on {
        crate::dom_video::wake();
    }
}

/// Something is in front of the page, or the page isn't up yet: page overlays stay hidden.
pub fn blocked() -> bool {
    LIGHTBOX.get() || PANEL.get() || !PAGE_SHOWN.get()
}

/// The lightbox covers everything, the panels' own overlays (Find's input) included.
pub fn lightbox_open() -> bool {
    LIGHTBOX.get()
}

#[derive(Clone, Copy)]
pub enum Gate {
    Page,
    Lightbox,
}

#[derive(Clone, Copy)]
pub enum Extent {
    Viewport,
    BetweenControls,
}

struct Placed<T> {
    page: String,
    epoch: u64,
    item: T,
}

pub struct Layer<T> {
    gate: Gate,
    extent: Extent,
    page: String,
    epoch: u64,
    entries: HashMap<String, Placed<T>>,
}

impl<T> Layer<T> {
    pub fn new(gate: Gate, extent: Extent) -> Self {
        Self {
            gate,
            extent,
            page: String::new(),
            epoch: 0,
            entries: HashMap::new(),
        }
    }

    pub fn page(&self) -> &str {
        &self.page
    }

    pub fn turn_to(&mut self, page: &str) -> Vec<(String, T)> {
        if self.page != page {
            self.page = page.to_string();
        }
        let (kept, gone): (HashMap<_, _>, HashMap<_, _>) = std::mem::take(&mut self.entries)
            .into_iter()
            .partition(|(_, placed)| placed.page == page);
        self.entries = kept;
        gone.into_iter()
            .map(|(key, placed)| (key, placed.item))
            .collect()
    }

    pub fn clear(&mut self) -> Vec<T> {
        self.entries
            .drain()
            .map(|(_, placed)| placed.item)
            .collect()
    }

    pub fn begin(&mut self) -> Vec<String> {
        let dropped = self
            .entries
            .iter()
            .filter(|(_, placed)| placed.epoch + 1 == self.epoch)
            .map(|(key, _)| key.clone())
            .collect();
        self.epoch += 1;
        dropped
    }

    pub fn place(&mut self, key: &str, new: impl FnOnce() -> T) -> &mut T {
        let placed = self
            .entries
            .entry(key.to_string())
            .or_insert_with(|| Placed {
                page: String::new(),
                epoch: 0,
                item: new(),
            });
        placed.page.clone_from(&self.page);
        placed.epoch = self.epoch;
        &mut placed.item
    }

    pub fn get(&self, key: &str) -> Option<&T> {
        self.entries.get(key).map(|placed| &placed.item)
    }

    pub fn get_mut(&mut self, key: &str) -> Option<&mut T> {
        self.entries.get_mut(key).map(|placed| &mut placed.item)
    }

    pub fn keys(&self) -> impl Iterator<Item = &str> {
        self.entries.keys().map(String::as_str)
    }

    #[cfg_attr(not(target_family = "wasm"), allow(dead_code))]
    pub fn iter(&self) -> impl Iterator<Item = (&str, bool, &T)> {
        self.entries
            .iter()
            .map(|(key, placed)| (key.as_str(), placed.epoch == self.epoch, &placed.item))
    }

    #[cfg_attr(not(target_family = "wasm"), allow(dead_code))]
    pub fn iter_mut(&mut self) -> impl Iterator<Item = (&str, bool, &mut T)> {
        let epoch = self.epoch;
        self.entries
            .iter_mut()
            .map(move |(key, placed)| (key.as_str(), placed.epoch == epoch, &mut placed.item))
    }

    pub fn gated(&self) -> bool {
        match self.gate {
            Gate::Page => blocked(),
            Gate::Lightbox => lightbox_open(),
        }
    }

    pub fn inset(&self, rect: Rect, clip: Rect) -> Option<[f32; 4]> {
        rect.inset_within(&match self.extent {
            Extent::Viewport => clip,
            Extent::BetweenControls => between_controls(clip),
        })
    }
}

/// On a phone the column runs under the corner pills, which are drawn on the canvas: an
/// element stops short of their bands rather than sit over them.
fn between_controls(clip: Rect) -> Rect {
    if !crate::route::narrow() {
        return clip;
    }
    let [top, _, bottom, _] = crate::route::safe_insets();
    let band = crate::design::INSET + crate::design::CONTROL_H + 8.0;
    let y0 = clip.y.max(top + band);
    let y1 = clip.y + clip.h - bottom - band;
    Rect {
        y: y0,
        h: (y1 - y0).max(0.0),
        ..clip
    }
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

    fn sorted<T: Ord>(mut items: Vec<T>) -> Vec<T> {
        items.sort();
        items
    }

    fn placed_now(layer: &Layer<u8>) -> Vec<(String, bool, u8)> {
        sorted(
            layer
                .iter()
                .map(|(key, placed, item)| (key.to_string(), placed, *item))
                .collect(),
        )
    }

    #[test]
    fn what_a_render_stops_placing_is_reported_once() {
        let mut layer = Layer::new(Gate::Page, Extent::Viewport);
        assert_eq!(layer.begin(), Vec::<String>::new());
        layer.place("a", || 1);
        layer.place("b", || 2);
        assert_eq!(layer.begin(), Vec::<String>::new());
        *layer.place("a", || 9) += 10;
        assert_eq!(
            placed_now(&layer),
            [("a".to_string(), true, 11), ("b".to_string(), false, 2)]
        );
        assert_eq!(layer.begin(), ["b"]);
        assert_eq!(layer.begin(), ["a"]);
        assert_eq!(layer.begin(), Vec::<String>::new());
        layer.place("b", || 7);
        assert_eq!(
            placed_now(&layer),
            [("a".to_string(), false, 11), ("b".to_string(), true, 2)]
        );
    }

    #[test]
    fn another_page_takes_away_what_the_last_one_placed() {
        let mut layer = Layer::new(Gate::Page, Extent::Viewport);
        assert!(layer.turn_to("/posts/a").is_empty());
        layer.place("clip-0", || 1);
        layer.place("clip-1", || 2);
        assert!(layer.turn_to("/posts/a").is_empty());
        assert_eq!(layer.page(), "/posts/a");
        assert_eq!(
            sorted(layer.turn_to("/posts/b")),
            [("clip-0".to_string(), 1), ("clip-1".to_string(), 2)]
        );
        layer.place("clip-0", || 3);
        assert!(layer.turn_to("/posts/b").is_empty());
        assert_eq!(sorted(layer.keys().collect()), ["clip-0"]);
        assert_eq!(layer.get("clip-0"), Some(&3));
        assert_eq!(layer.clear(), [3]);
        assert_eq!(layer.keys().count(), 0);
    }
}
