//! The selection in text space: a block's place in the document and a byte offset into it.
//! Nothing here knows about the screen, so scrolling, re-rendering and resizing need no
//! bookkeeping. Pure: unit-tested without a window.

use std::ops::Range;

use gpui::{Pixels, Point, px};

/// Where a block sits in a scope's document order, for one render of one content key.
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Ordinal(pub u32);

/// A caret between characters. Ordering is (block, byte); the byte is a char boundary.
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Pos {
    pub block: Ordinal,
    pub byte: usize,
}

impl Pos {
    pub fn new(block: Ordinal, byte: usize) -> Self {
        Self { block, byte }
    }
}

/// What a drag snaps to: set by the click count or a long press.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Granularity {
    Char,
    Word,
    Block,
}

/// A touch selection shows handles and a Copy pill; a pointer selection shows neither.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Origin {
    Pointer,
    Touch,
}

/// Both ends are groups (a word, a block, or a collapsed caret) so a word or block drag keeps
/// the whole original word or block selected whichever way the pointer goes.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Span {
    pub anchor: (Pos, Pos),
    pub focus: (Pos, Pos),
    pub granularity: Granularity,
    pub origin: Origin,
}

impl Span {
    pub fn new(anchor: (Pos, Pos), granularity: Granularity, origin: Origin) -> Self {
        Self {
            anchor,
            focus: anchor,
            granularity,
            origin,
        }
    }

    /// The selected [start, end).
    pub fn span(&self) -> (Pos, Pos) {
        (
            self.anchor.0.min(self.focus.0),
            self.anchor.1.max(self.focus.1),
        )
    }

    pub fn is_empty(&self) -> bool {
        let (s, e) = self.span();
        s >= e
    }

    /// The selected bytes of `block`, whose text is `len` bytes long. Two comparisons.
    pub fn range_in(&self, block: Ordinal, len: usize) -> Option<Range<usize>> {
        let (s, e) = self.span();
        if block < s.block || block > e.block {
            return None;
        }
        let start = if block == s.block { s.byte } else { 0 };
        let end = if block == e.block {
            e.byte.min(len)
        } else {
            len
        };
        (start < end).then_some(start..end)
    }
}

/// What goes between a block and the one before it in copied text.
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub enum Join {
    #[default]
    Paragraph,
    Line,
    Tab,
    Space,
    Nothing,
}

impl Join {
    pub fn as_str(self) -> &'static str {
        match self {
            Join::Paragraph => "\n\n",
            Join::Line => "\n",
            Join::Tab => "\t",
            Join::Space => " ",
            Join::Nothing => "",
        }
    }
}

/// A cheap identity for a block's text: its length and its first and last eight bytes. Enough
/// to notice a block changing under a selection without hashing whole paragraphs each frame.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Fingerprint {
    len: usize,
    head: u64,
    tail: u64,
}

impl Fingerprint {
    pub fn of(text: &str) -> Self {
        let b = text.as_bytes();
        let pack = |s: &[u8]| {
            let mut a = [0u8; 8];
            a[..s.len()].copy_from_slice(s);
            u64::from_le_bytes(a)
        };
        Self {
            len: b.len(),
            head: pack(&b[..b.len().min(8)]),
            tail: pack(&b[b.len().saturating_sub(8)..]),
        }
    }
}

/// A platform's click count only means a double or triple click when the clicks land near
/// each other (after editable_text's `apply_click`).
pub fn effective_click_count(
    count: usize,
    at: Point<Pixels>,
    last: Option<Point<Pixels>>,
) -> usize {
    match last {
        Some(l) if count > 1 => {
            let near = (at.x - l.x).abs() <= px(4.) && (at.y - l.y).abs() <= px(4.);
            if near { count } else { 1 }
        }
        _ => 1,
    }
}

/// The selection as plain text. `blocks` yields every block of the document in order with its
/// join; only the ones the span touches contribute.
pub fn plain_text<'a>(
    span: &Span,
    blocks: impl Iterator<Item = (Ordinal, &'a str, Join)>,
) -> String {
    let mut out = String::new();
    let mut first = true;
    for (ordinal, text, join) in blocks {
        let Some(r) = span.range_in(ordinal, text.len()) else {
            continue;
        };
        if !first {
            out.push_str(join.as_str());
        }
        first = false;
        out.push_str(text.get(r).unwrap_or(""));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui::point;

    fn p(block: u32, byte: usize) -> Pos {
        Pos::new(Ordinal(block), byte)
    }

    #[test]
    fn a_span_orders_its_ends_and_keeps_whole_groups() {
        let mut s = Span::new((p(2, 4), p(2, 9)), Granularity::Word, Origin::Pointer);
        s.focus = (p(0, 1), p(0, 3));
        assert_eq!(s.span(), (p(0, 1), p(2, 9)));
        s.focus = (p(5, 0), p(5, 2));
        assert_eq!(s.span(), (p(2, 4), p(5, 2)));
        assert!(!s.is_empty());
        assert!(Span::new((p(1, 3), p(1, 3)), Granularity::Char, Origin::Pointer).is_empty());
    }

    #[test]
    fn range_in_slices_the_end_blocks_and_covers_the_middle() {
        let s = Span {
            anchor: (p(1, 5), p(1, 5)),
            focus: (p(3, 2), p(3, 2)),
            granularity: Granularity::Char,
            origin: Origin::Pointer,
        };
        assert_eq!(s.range_in(Ordinal(0), 10), None);
        assert_eq!(s.range_in(Ordinal(1), 10), Some(5..10));
        assert_eq!(s.range_in(Ordinal(2), 7), Some(0..7));
        assert_eq!(s.range_in(Ordinal(3), 10), Some(0..2));
        assert_eq!(s.range_in(Ordinal(4), 10), None);
        let s = Span {
            focus: (p(3, 0), p(3, 0)),
            ..s
        };
        assert_eq!(
            s.range_in(Ordinal(3), 10),
            None,
            "a selection ending at a block's start takes none of it"
        );
    }

    #[test]
    fn plain_text_joins_only_the_touched_blocks() {
        let s = Span {
            anchor: (p(0, 6), p(0, 6)),
            focus: (p(2, 3), p(2, 3)),
            granularity: Granularity::Char,
            origin: Origin::Pointer,
        };
        let blocks = [
            (Ordinal(0), "Hello world", Join::Paragraph),
            (Ordinal(1), "cell", Join::Tab),
            (Ordinal(2), "Third paragraph", Join::Paragraph),
            (Ordinal(3), "never", Join::Paragraph),
        ];
        assert_eq!(plain_text(&s, blocks.iter().copied()), "world\tcell\n\nThi");
    }

    #[test]
    fn fingerprints_tell_texts_apart_and_survive_short_ones() {
        assert_eq!(Fingerprint::of("abc"), Fingerprint::of("abc"));
        assert_ne!(Fingerprint::of("abc"), Fingerprint::of("abd"));
        assert_ne!(Fingerprint::of(""), Fingerprint::of("a"));
        assert_ne!(
            Fingerprint::of("same head, different middle, same tail"),
            Fingerprint::of("same head, another  middle, same tail")
        );
    }

    #[test]
    fn a_double_click_counts_only_near_the_last_click() {
        let here = point(px(10.), px(10.));
        assert_eq!(effective_click_count(2, here, None), 1);
        assert_eq!(
            effective_click_count(2, here, Some(point(px(12.), px(11.)))),
            2
        );
        assert_eq!(
            effective_click_count(2, here, Some(point(px(40.), px(10.)))),
            1
        );
        assert_eq!(effective_click_count(1, here, Some(here)), 1);
    }
}
