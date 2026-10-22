//! What one real render of a scope saw: every selectable block in document order, with the
//! geometry to hit-test it and the rects to highlight it. Rebuilt on each real render and kept
//! across replayed (cached) frames, whose geometry did not move.

use std::ops::Range;
use std::rc::Rc;

use gpui::{
    App, Bounds, Hitbox, Pixels, Point, SharedString, TextLayout, TextSelectionKind, Window, px,
};

use super::model::{Fingerprint, Granularity, Join, Ordinal, Pos, Span, plain_text};

/// A block's geometry, in window coordinates. `TextLayout` implements it; tests use a grid.
pub trait BlockGeometry {
    fn bounds(&self) -> Bounds<Pixels>;
    fn len(&self) -> usize;
    /// The caret closest to a point inside `bounds`.
    fn caret(&self, p: Point<Pixels>) -> usize;
    /// The word or hard line under a point inside `bounds`.
    fn group(&self, p: Point<Pixels>, kind: TextSelectionKind) -> Range<usize>;
    /// One rect per visual line the byte range covers.
    fn rects(&self, range: Range<usize>) -> Vec<Bounds<Pixels>>;
    fn text(&self) -> String;
}

pub type OnLink = Rc<dyn Fn(usize, &mut Window, &mut App)>;

pub struct Block<G> {
    pub geometry: G,
    pub fingerprint: Fingerprint,
    pub join: Join,
    pub links: Rc<[Range<usize>]>,
    pub on_link: Option<OnLink>,
    /// the text as given, when it was given as a string: a truncated block copies whole as this
    pub source: Option<SharedString>,
    /// the element's hitbox: a press counts only where nothing drawn over the page covers it
    pub hitbox: Option<Hitbox>,
}

/// Where a point landed in a block: the caret, and the groups a double click or long press
/// would take, so the reducer never has to ask for geometry.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Hit {
    pub pos: Pos,
    pub word: (Pos, Pos),
    pub block: (Pos, Pos),
    pub link: Option<usize>,
}

impl Hit {
    pub fn group(&self, g: Granularity) -> (Pos, Pos) {
        match g {
            Granularity::Char => (self.pos, self.pos),
            Granularity::Word => self.word,
            Granularity::Block => self.block,
        }
    }
}

pub struct Registry<G> {
    blocks: Vec<Block<G>>,
    building: Option<Vec<Block<G>>>,
}

impl<G> Default for Registry<G> {
    fn default() -> Self {
        Self {
            blocks: Vec::new(),
            building: None,
        }
    }
}

impl<G: BlockGeometry> Registry<G> {
    pub fn begin(&mut self) {
        self.building = Some(Vec::with_capacity(self.blocks.len()));
    }

    /// Registers a block prepainting inside the scope. Outside one (deferred or anchored
    /// content that prepaints after the scope committed) nothing is registered.
    pub fn push(&mut self, block: Block<G>) -> Option<Ordinal> {
        let building = self.building.as_mut()?;
        building.push(block);
        Some(Ordinal(building.len() as u32 - 1))
    }

    /// Swaps the new render in. False when a selection's ends no longer name the same text.
    pub fn commit(&mut self, selection: Option<&Span>) -> bool {
        let Some(fresh) = self.building.take() else {
            return true;
        };
        let old = std::mem::replace(&mut self.blocks, fresh);
        let Some(span) = selection else {
            return true;
        };
        let (s, e) = span.span();
        [s, e].iter().all(|p| {
            let i = p.block.0 as usize;
            match (old.get(i), self.blocks.get(i)) {
                (Some(was), Some(now)) => {
                    was.fingerprint == now.fingerprint && p.byte <= now.geometry.len()
                }
                _ => false,
            }
        })
    }

    pub fn is_empty(&self) -> bool {
        self.blocks.is_empty()
    }

    pub fn blocks(&self) -> &[Block<G>] {
        &self.blocks
    }

    pub fn get(&self, o: Ordinal) -> Option<&Block<G>> {
        self.blocks.get(o.0 as usize)
    }

    /// The block under `p`, or the closest one by rect distance (document order breaks ties).
    pub fn nearest(&self, p: Point<Pixels>) -> Option<Ordinal> {
        let mut best: Option<(f32, usize)> = None;
        for (i, b) in self.blocks.iter().enumerate() {
            let r = b.geometry.bounds();
            let dx = f32::from((r.left() - p.x).max(p.x - r.right()).max(px(0.)));
            let dy = f32::from((r.top() - p.y).max(p.y - r.bottom()).max(px(0.)));
            // a point beside a line belongs to that line, not to a nearer block in another row
            let d = dy * 4. + dx;
            if best.is_none_or(|(bd, _)| d < bd) {
                best = Some((d, i));
            }
        }
        best.map(|(_, i)| Ordinal(i as u32))
    }

    /// The closest caret in block `o` to `p`, which may lie outside the block: above it is its
    /// start, below it its end, beside it the nearer edge of that line.
    pub fn caret_at(&self, o: Ordinal, p: Point<Pixels>) -> Pos {
        let g = &self.blocks[o.0 as usize].geometry;
        let r = g.bounds();
        let byte = if p.y < r.top() {
            0
        } else if p.y >= r.bottom() {
            g.len()
        } else {
            g.caret(Self::clamp_x(r, p))
        };
        Pos::new(o, byte)
    }

    fn clamp_x(r: Bounds<Pixels>, p: Point<Pixels>) -> Point<Pixels> {
        Point::new(p.x.max(r.left()).min(r.right() - px(0.01)), p.y)
    }

    /// Everything the reducer needs to know about a point in block `o`.
    pub fn hit(&self, o: Ordinal, p: Point<Pixels>) -> Hit {
        let b = &self.blocks[o.0 as usize];
        let g = &b.geometry;
        let r = g.bounds();
        let pos = self.caret_at(o, p);
        let len = g.len();
        let inside = p.y >= r.top() && p.y < r.bottom();
        let word = if inside {
            let w = g.group(Self::clamp_x(r, p), TextSelectionKind::Word);
            if w.is_empty() {
                (pos, pos)
            } else {
                (Pos::new(o, w.start), Pos::new(o, w.end))
            }
        } else {
            (pos, pos)
        };
        let link = b.links.iter().position(|l| l.contains(&pos.byte));
        Hit {
            pos,
            word,
            block: (Pos::new(o, 0), Pos::new(o, len)),
            link,
        }
    }

    /// The whole document, for select-all.
    pub fn whole(&self) -> Option<(Pos, Pos)> {
        let last = self.blocks.last()?;
        Some((
            Pos::new(Ordinal(0), 0),
            Pos::new(Ordinal(self.blocks.len() as u32 - 1), last.geometry.len()),
        ))
    }

    pub fn rects(&self, o: Ordinal, range: Range<usize>) -> Vec<Bounds<Pixels>> {
        self.blocks[o.0 as usize].geometry.rects(range)
    }

    /// Every highlight rect of a span, in document order.
    pub fn span_rects(&self, span: &Span) -> Vec<Bounds<Pixels>> {
        let (s, e) = span.span();
        let mut out = Vec::new();
        for i in s.block.0..=e.block.0 {
            let Some(b) = self.blocks.get(i as usize) else {
                break;
            };
            if let Some(r) = span.range_in(Ordinal(i), b.geometry.len()) {
                out.extend(b.geometry.rects(r));
            }
        }
        out
    }

    pub fn text(&self, span: &Span) -> String {
        let (s, e) = span.span();
        let texts: Vec<(Ordinal, String, Join)> = (s.block.0..=e.block.0)
            .filter_map(|i| {
                let b = self.blocks.get(i as usize)?;
                let shaped = b.geometry.text();
                let whole = span.range_in(Ordinal(i), shaped.len()) == Some(0..shaped.len());
                let text = match (&b.source, whole) {
                    (Some(source), true) => source.to_string(),
                    _ => shaped,
                };
                Some((Ordinal(i), text, b.join))
            })
            .collect();
        plain_text(span, texts.iter().map(|(o, t, j)| (*o, t.as_str(), *j)))
    }
}

/// A prepainted `TextLayout`: measured, with bounds, in window coordinates.
pub struct Live {
    pub layout: TextLayout,
    pub bounds: Bounds<Pixels>,
}

impl BlockGeometry for Live {
    fn bounds(&self) -> Bounds<Pixels> {
        self.bounds
    }

    fn len(&self) -> usize {
        self.layout.len()
    }

    fn caret(&self, p: Point<Pixels>) -> usize {
        let Some(line) = self.layout.line_layouts().into_iter().next() else {
            return 0;
        };
        line.closest_byte_index_for_pixel_point(p - self.bounds.origin, self.layout.line_height())
            .unwrap_or_else(|edge| edge)
    }

    fn group(&self, p: Point<Pixels>, kind: TextSelectionKind) -> Range<usize> {
        let Some(line) = self.layout.line_layouts().into_iter().next() else {
            return 0..0;
        };
        line.selection_from_pixel_point(p - self.bounds.origin, self.layout.line_height(), kind)
    }

    fn rects(&self, range: Range<usize>) -> Vec<Bounds<Pixels>> {
        let Some(line) = self.layout.line_layouts().into_iter().next() else {
            return Vec::new();
        };
        let mut rects = line.selection_bounds(range, self.layout.line_height());
        for r in rects.iter_mut() {
            r.origin += self.bounds.origin;
        }
        rects.into_vec()
    }

    fn text(&self) -> String {
        self.layout.text()
    }
}

#[cfg(test)]
pub(super) mod grid {
    //! A monospace grid of `cell` px squares, one block per line of text, for tests.
    use super::*;
    use gpui::{point, size};

    pub struct Grid {
        pub origin: Point<Pixels>,
        pub text: String,
        pub cell: f32,
    }

    impl Grid {
        fn col(&self, p: Point<Pixels>) -> usize {
            (f32::from(p.x - self.origin.x) / self.cell).floor().max(0.) as usize
        }
    }

    impl BlockGeometry for Grid {
        fn bounds(&self) -> Bounds<Pixels> {
            Bounds::new(
                self.origin,
                size(px(self.text.len() as f32 * self.cell), px(self.cell)),
            )
        }
        fn len(&self) -> usize {
            self.text.len()
        }
        fn caret(&self, p: Point<Pixels>) -> usize {
            let x = f32::from(p.x - self.origin.x) / self.cell;
            (x.round().max(0.) as usize).min(self.text.len())
        }
        fn group(&self, p: Point<Pixels>, _: TextSelectionKind) -> Range<usize> {
            let c = self.col(p).min(self.text.len().saturating_sub(1));
            let b = self.text.as_bytes();
            let start = (0..=c).rev().find(|&i| b[i] == b' ').map_or(0, |i| i + 1);
            let end = (c..b.len()).find(|&i| b[i] == b' ').unwrap_or(b.len());
            start..end
        }
        fn rects(&self, range: Range<usize>) -> Vec<Bounds<Pixels>> {
            let mut v = Vec::new();
            v.push(Bounds::new(
                point(
                    self.origin.x + px(range.start as f32 * self.cell),
                    self.origin.y,
                ),
                size(px(range.len() as f32 * self.cell), px(self.cell)),
            ));
            v
        }
        fn text(&self) -> String {
            self.text.clone()
        }
    }

    pub fn block(y: f32, text: &str) -> Block<Grid> {
        Block {
            geometry: Grid {
                origin: point(px(100.), px(y)),
                text: text.to_string(),
                cell: 10.,
            },
            fingerprint: Fingerprint::of(text),
            join: Join::Paragraph,
            links: Rc::from(Vec::new()),
            on_link: None,
            source: None,
            hitbox: None,
        }
    }

    pub fn registry(lines: &[&str]) -> Registry<Grid> {
        let mut r = Registry::default();
        r.begin();
        for (i, l) in lines.iter().enumerate() {
            r.push(block(100. + i as f32 * 30., l));
        }
        r.commit(None);
        r
    }
}

#[cfg(test)]
mod tests {
    use super::grid::*;
    use super::*;
    use gpui::point;

    fn at(x: f32, y: f32) -> Point<Pixels> {
        point(px(x), px(y))
    }

    #[test]
    fn nearest_prefers_the_block_beside_the_point_over_a_closer_corner() {
        // lines at y 100, 130, 160 of 10px height; a point in the right margin of the 2nd
        let r = registry(&["one two", "three four five", "six"]);
        assert_eq!(r.nearest(at(400., 135.)), Some(Ordinal(1)));
        assert_eq!(r.nearest(at(120., 50.)), Some(Ordinal(0)));
        assert_eq!(r.nearest(at(120., 500.)), Some(Ordinal(2)));
        // in the gap just under line 0 (ends at 110): line 0
        assert_eq!(r.nearest(at(120., 112.)), Some(Ordinal(0)));
    }

    #[test]
    fn a_caret_outside_a_block_lands_on_its_edges() {
        let r = registry(&["one two", "three four five"]);
        assert_eq!(r.caret_at(Ordinal(0), at(50., 105.)).byte, 0);
        assert_eq!(r.caret_at(Ordinal(0), at(900., 105.)).byte, 7);
        assert_eq!(r.caret_at(Ordinal(0), at(130., 50.)).byte, 0);
        assert_eq!(r.caret_at(Ordinal(0), at(130., 300.)).byte, 7);
        assert_eq!(r.caret_at(Ordinal(0), at(141., 105.)).byte, 4);
    }

    #[test]
    fn a_hit_carries_the_word_and_the_block() {
        let r = registry(&["one two", "three four five"]);
        let h = r.hit(Ordinal(1), at(162., 135.));
        assert_eq!(h.pos, Pos::new(Ordinal(1), 6));
        assert_eq!(h.word, (Pos::new(Ordinal(1), 6), Pos::new(Ordinal(1), 10)));
        assert_eq!(h.block, (Pos::new(Ordinal(1), 0), Pos::new(Ordinal(1), 15)));
        assert_eq!(h.group(Granularity::Char), (h.pos, h.pos));
    }

    #[test]
    fn commit_drops_a_selection_whose_text_changed() {
        let mut r = registry(&["one two", "three four five"]);
        let span = Span::new(
            (Pos::new(Ordinal(1), 0), Pos::new(Ordinal(1), 5)),
            Granularity::Word,
            super::super::model::Origin::Pointer,
        );
        r.begin();
        r.push(block(100., "one two"));
        r.push(block(130., "three four five"));
        assert!(r.commit(Some(&span)));
        r.begin();
        r.push(block(100., "inserted"));
        r.push(block(130., "one two"));
        r.push(block(160., "three four five"));
        assert!(!r.commit(Some(&span)));
        r.begin();
        assert!(!r.commit(Some(&span)));
    }

    #[test]
    fn rects_and_text_cover_the_span() {
        let r = registry(&["one two", "three four five", "six"]);
        let span = Span::new(
            (Pos::new(Ordinal(0), 4), Pos::new(Ordinal(2), 1)),
            Granularity::Char,
            super::super::model::Origin::Pointer,
        );
        assert_eq!(r.text(&span), "two\n\nthree four five\n\ns");
        let rects = r.span_rects(&span);
        assert_eq!(rects.len(), 3);
        assert_eq!(rects[0].origin, at(140., 100.));
        assert_eq!(rects[2].size.width, px(10.));
        assert_eq!(
            r.whole(),
            Some((Pos::new(Ordinal(0), 0), Pos::new(Ordinal(2), 3)))
        );
    }
}
