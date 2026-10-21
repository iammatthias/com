//! The titles in script: shaped, rasterized to signed distance and laid end to end in an RG8
//! atlas with its segment table, all on the CPU, ready for the plate to upload.

use swash::FontRef;
use swash::scale::{Render as Raster, ScaleContext, Source};
use swash::shape::ShapeContext;
use swash::zeno::{Format, Vector};

use super::{Mark, Title};

// atlas metrics, as the artifact draws them
pub(super) const FONT: f32 = 40.0;
pub(super) const PAD: f32 = 10.0;
pub(super) const HAIR: f32 = 5.0 * FONT / 52.0;
const TRACK: f32 = 0.01 * FONT;
const XH_BAND: f32 = 0.44;
const MAX_TEXT: usize = 131_000;
const MAX_ROW: usize = 4096;
/// atlas px of signed distance the lettering's field holds either side of the outline
pub(super) const SPREAD: f32 = 8.0;
/// the script's pen radius at its raw weight, in atlas px (its full stop is a 5.4px dot at 52px, weight 300)
const PEN_RAW: f32 = 2.52 * FONT / 52.0;

pub(super) struct Seg {
    pub(super) title: Title,
    pub(super) x0: f32,
    pub(super) x1: f32,
}

/// Every title shaped in script and laid end to end, joined by hairlines, wrapped into rows.
pub(super) struct TitleAtlas {
    pub(super) width: u32,
    pub(super) height: u32,
    /// RG8 mip chain: R = all lettering and joins, G = section headings
    pub(super) levels: Vec<Vec<u8>>,
    pub(super) segs_w: u32,
    pub(super) segs_h: u32,
    pub(super) seg_table: Vec<u8>,
    pub(super) segs: Vec<Seg>,
    pub(super) text_len: f32,
    /// some titles didn't fit in MAX_TEXT and were left off
    pub(super) full: bool,
    pub(super) row_w: f32,
    pub(super) stride: f32,
    pub(super) row_h: f32,
    pub(super) row_c: f32,
    pub(super) font_ref: f32,
}

impl TitleAtlas {
    pub(super) fn build(titles: &[Title]) -> Self {
        crate::mark(&format!("atlas build start {}", titles.len()));
        let titles: Vec<Title> = if titles.is_empty() {
            vec![Title {
                label: "iammatthias.com".into(),
                href: Some("/".into()),
                mark: Mark::Ink,
            }]
        } else {
            titles.to_vec()
        };
        let font = FontRef::from_index(crate::fonts::script(), 0).expect("script face");
        // measured from the letters themselves, as the artifact does: declared metrics are
        // generous in this hand (a 95% ascent) and would leave the rows half empty
        let (xh, _) = ink_extent(font, "xxxx");
        let xh = if xh > 0.0 { xh } else { FONT * 0.45 };
        let font_ref = xh / XH_BAND;
        let asc = ink_extent(font, "ÁÉlbdfhkTWQ").0.ceil() + 2.0;
        let desc = ink_extent(font, "gjpqyfQ").1.ceil() + 2.0;
        let row_h = asc + desc;
        let stride = row_h + PAD * 2.0;
        let row_c = asc - 2.0 - xh * 0.5;
        let lead = FONT * 0.6;

        // shape every title, place it with lead-in and lead-out hairlines
        let mut shape = ShapeContext::new();
        let mut placed: Vec<(Seg, f32, f32, Vec<(u16, f32)>)> = Vec::new();
        let mut x = 0.0f32;
        let wanted = titles.len();
        for title in titles {
            let mut shaper = shape.builder(font).size(FONT).build();
            shaper.add_str(&title.label);
            let mut glyphs = Vec::new();
            let mut pen = 0.0f32;
            shaper.shape_with(|cluster| {
                for g in cluster.glyphs {
                    glyphs.push((g.id, pen + g.x));
                    pen += g.advance;
                }
                pen += TRACK;
            });
            let t0 = x + lead;
            let t1 = t0 + pen;
            let x1 = ((t1 + lead) / 2.0).ceil() * 2.0;
            // the strip is full: a title past its end would wrap over the first ones
            if x1 as usize > MAX_TEXT && !placed.is_empty() {
                break;
            }
            placed.push((Seg { title, x0: x, x1 }, t0, t1, glyphs));
            x = x1;
        }
        let text_len = (x as usize).min(MAX_TEXT).max(2);
        let row_w = text_len.min(MAX_ROW);
        let rows = text_len.div_ceil(row_w);
        let stride_px = stride as usize;

        // one long strip, wrapping at text_len so the spiral's seam is seamless. R holds the
        // lettering as signed distance (128 the outline, inside higher; 0 is far outside), so
        // the shader can set the pen; G the colour code
        // (written straight into its rows: a position along the strip is a row and a column)
        let (w, h) = (row_w, rows * stride_px);
        let mut level0 = vec![0u8; w * h * 2];
        // where a strip column starts in the rows, and how far down one pixel is
        let column = |x: i64| -> usize {
            let x = x.rem_euclid(text_len as i64) as usize;
            let (r, col) = (x / row_w, x % row_w);
            (r * stride_px * row_w + col) * 2
        };
        let down = row_w * 2;
        let at = |x: i64, y: i64| -> Option<usize> {
            if y < 0 || y as usize >= stride_px {
                return None;
            }
            Some(column(x) + y as usize * down)
        };
        let enc = |d: f32| (128.0 + d * (127.0 / SPREAD)).round().clamp(0.0, 255.0) as u8;
        let mut scale = ScaleContext::new();
        let mut scaler = scale.builder(font).size(FONT).hint(false).build();
        // each glyph's distance field once per quarter-pixel offset, stamped wherever it recurs:
        // the union of shapes is the max of their signed distances
        let mut sprites: std::collections::HashMap<(u16, u8), Option<Sprite>> =
            std::collections::HashMap::new();
        let mut sdf = Sdf::default();
        let base = PAD + asc;
        let join = PAD + row_c;
        for (seg, t0, t1, glyphs) in &placed {
            let (t0, t1) = (*t0, *t1);
            for &(id, gx) in glyphs {
                let gx = t0 + gx;
                let q = ((gx.fract() * 4.0).round() as u8) % 4;
                let sprite = sprites
                    .entry((id, q))
                    .or_insert_with(|| Sprite::make(&mut scaler, &mut sdf, id, q as f32 / 4.0))
                    .as_ref();
                let Some(sp) = sprite else { continue };
                let ox = gx.floor() as i64 + sp.left;
                let oy = base.round() as i64 - sp.top;
                // the rows of the sprite that land inside the strip's height
                let (r0, r1) = (
                    (-oy).max(0) as usize,
                    ((stride_px as i64 - oy).min(sp.h as i64)).max(0) as usize,
                );
                for col in 0..sp.w {
                    let (f, t) = sp.spans[col];
                    let (f, t) = (f.max(r0), t.min(r1));
                    if f >= t {
                        continue;
                    }
                    let base_i = column(ox + col as i64);
                    for row in f..t {
                        let v = sp.data[row * sp.w + col];
                        if v > 0 {
                            let i = base_i + (oy + row as i64) as usize * down;
                            level0[i] = level0[i].max(v);
                        }
                    }
                }
            }
            // colour, over the whole span of the title (`Mark::code`). Read unfiltered, so neighbours
            // never blend into another colour
            let code = seg.title.mark.code();
            if code > 0 {
                // the shader reads it from the row's middle only (unfiltered): a few rows will do
                let mid = (PAD + row_h * 0.5) as usize;
                for xi in t0.floor() as i64..t1.ceil() as i64 {
                    let base_i = column(xi);
                    for yi in mid.saturating_sub(1)..(mid + 2).min(stride_px) {
                        level0[base_i + yi * down + 1] = code;
                    }
                }
            }
            // the hairline that runs in to the title and out of it: its distance is exact
            let reach = HAIR * 0.5 + SPREAD + 1.0;
            for (a, b) in [
                (seg.x0 - 1.0, t0 + FONT * 0.05),
                (t1 - FONT * 0.04, seg.x1 + 1.0),
            ] {
                for xi in a.floor() as i64..b.ceil() as i64 {
                    for yi in (join - reach).floor() as i64..=(join + reach).ceil() as i64 {
                        let d = HAIR * 0.5 - (yi as f32 + 0.5 - join).abs();
                        if let Some(i) = at(xi, yi) {
                            level0[i] = level0[i].max(enc(d));
                        }
                    }
                }
            }
        }

        // the segment table: for every atlas column, the [start, end) of the title it belongs to
        let segs: Vec<Seg> = placed.into_iter().map(|(s, ..)| s).collect();
        let mut seg_table = vec![0u8; row_w * rows * 4];
        let mut si = 0;
        for i in 0..row_w * rows {
            let ui = i.min(text_len - 1) as f32;
            while si + 1 < segs.len() && ui >= segs[si].x1 {
                si += 1;
            }
            let a = (segs[si].x0 / 2.0) as u32;
            let b = (segs[si].x1.min(text_len as f32) / 2.0) as u32;
            seg_table[i * 4..i * 4 + 4].copy_from_slice(&[
                (a >> 8) as u8,
                a as u8,
                (b >> 8) as u8,
                b as u8,
            ]);
        }

        if segs.len() < wanted {
            crate::limits::reached(
                "lettered text (131,000 atlas px, the 16-bit segment table): later titles aren't written",
            );
        }
        Self {
            width: w as u32,
            height: h as u32,
            levels: mips(level0, w, h, 2, ATLAS_LEVELS),
            segs_w: row_w as u32,
            segs_h: rows as u32,
            seg_table,
            full: segs.len() < wanted,
            segs,
            text_len: text_len as f32,
            row_w: row_w as f32,
            stride,
            row_h,
            row_c,
            font_ref,
        }
    }
}

/// How far `text`'s ink rises above the baseline and falls below it, in atlas px.
fn ink_extent(font: FontRef, text: &str) -> (f32, f32) {
    let mut scale = ScaleContext::new();
    let mut scaler = scale.builder(font).size(FONT).hint(false).build();
    let (mut up, mut down) = (0.0f32, 0.0f32);
    for ch in text.chars() {
        let id = font.charmap().map(ch);
        if let Some(outline) = scaler.scale_outline(id) {
            let b = outline.bounds();
            up = up.max(b.max.y);
            down = down.max(-b.min.y);
        }
    }
    (up, down)
}

/// One glyph's lettering as signed distance, padded by SPREAD so it carries its whole field.
struct Sprite {
    left: i64,
    top: i64,
    w: usize,
    h: usize,
    data: Vec<u8>,
    /// for each column, the rows [from, to) that carry any field (the rest is zero)
    spans: Vec<(usize, usize)>,
}

impl Sprite {
    fn make(scaler: &mut swash::scale::Scaler, sdf: &mut Sdf, id: u16, frac: f32) -> Option<Self> {
        let img = Raster::new(&[Source::Outline])
            .format(Format::Alpha)
            .offset(Vector::new(frac, 0.0))
            .render(scaler, id)?;
        let p = img.placement;
        if p.width == 0 || p.height == 0 {
            return None;
        }
        let pad = SPREAD as usize + 1;
        let (w, h) = (p.width as usize + pad * 2, p.height as usize + pad * 2);
        let mut band = vec![0u8; w * h * 2];
        for row in 0..p.height as usize {
            for col in 0..p.width as usize {
                band[((row + pad) * w + col + pad) * 2] = img.data[row * p.width as usize + col];
            }
        }
        sdf.encode(&mut band, w, h);
        let data: Vec<u8> = band.chunks(2).map(|c| c[0]).collect();
        let spans = (0..w)
            .map(|col| {
                let mut rows = (0..h).filter(|&row| data[row * w + col] > 0);
                let from = rows.next();
                match from {
                    Some(f) => (
                        f,
                        (0..h)
                            .rev()
                            .find(|&row| data[row * w + col] > 0)
                            .map_or(f, |l| l + 1),
                    ),
                    None => (0, 0),
                }
            })
            .collect();
        Some(Self {
            left: p.left as i64 - pad as i64,
            top: p.top as i64 + pad as i64,
            w,
            h,
            data,
            spans,
        })
    }
}

/// Scratch for turning coverage into signed distance: nearest-seed vectors propagated in two
/// passes (8SSEDT), once toward the ink and once toward the paper. Exact enough within the
/// SPREAD the shader reads, and linear in the pixels with a small constant.
#[derive(Default)]
struct Sdf {
    near: Vec<(i16, i16)>,
}

impl Sdf {
    /// Rewrite the R channel of an RG band from coverage to distance: 128 is the outline,
    /// higher is inside, `SPREAD` atlas px either way spans the full byte.
    fn encode(&mut self, band: &mut [u8], w: usize, h: usize) {
        let to_ink = self.field(band, w, h, |c| c >= 128);
        let to_paper = self.field(band, w, h, |c| c < 128);
        for i in 0..w * h {
            let cov = band[i * 2] as f32 / 255.0;
            let signed = if cov > 0.0 && cov < 1.0 {
                cov - 0.5
            } else if cov >= 0.5 {
                to_paper[i] - 0.5
            } else {
                0.5 - to_ink[i]
            };
            band[i * 2] = (128.0 + signed * (127.0 / SPREAD))
                .round()
                .clamp(0.0, 255.0) as u8;
        }
    }

    /// Distance from each pixel to the nearest pixel whose coverage passes `seed`, capped a
    /// little past SPREAD. Sprites are padded past SPREAD, so the border needn't be visited.
    fn field(&mut self, band: &[u8], w: usize, h: usize, seed: impl Fn(u8) -> bool) -> Vec<f32> {
        const FAR: i32 = 64;
        let n = w * h;
        self.near.clear();
        self.near.extend((0..n).map(|i| {
            if seed(band[i * 2]) {
                (0, 0)
            } else {
                (FAR as i16, FAR as i16)
            }
        }));
        let near = &mut self.near;
        #[inline(always)]
        fn d2(x: i32, y: i32) -> i32 {
            x * x + y * y
        }
        // try neighbour `j` (at offset ox, oy from i) as a better route to a seed
        #[inline(always)]
        fn try_from(near: &mut [(i16, i16)], i: usize, j: usize, ox: i32, oy: i32) {
            let o = near[j];
            if o.0 as i32 >= FAR {
                return;
            }
            let (cx, cy) = (o.0 as i32 + ox, o.1 as i32 + oy);
            let c = near[i];
            if d2(cx, cy) < d2(c.0 as i32, c.1 as i32) {
                near[i] = (cx as i16, cy as i16);
            }
        }
        if w < 3 || h < 3 {
            return near
                .iter()
                .map(|&(x, y)| (d2(x as i32, y as i32) as f32).sqrt())
                .collect();
        }
        for y in 1..h - 1 {
            for x in 1..w - 1 {
                let i = y * w + x;
                try_from(near, i, i - 1, -1, 0);
                try_from(near, i, i - w - 1, -1, -1);
                try_from(near, i, i - w, 0, -1);
                try_from(near, i, i - w + 1, 1, -1);
            }
            for x in (1..w - 1).rev() {
                let i = y * w + x;
                try_from(near, i, i + 1, 1, 0);
            }
        }
        for y in (1..h - 1).rev() {
            for x in (1..w - 1).rev() {
                let i = y * w + x;
                try_from(near, i, i + 1, 1, 0);
                try_from(near, i, i + w + 1, 1, 1);
                try_from(near, i, i + w, 0, 1);
                try_from(near, i, i + w - 1, -1, 1);
            }
            for x in 1..w - 1 {
                let i = y * w + x;
                try_from(near, i, i - 1, -1, 0);
            }
        }
        near.iter()
            .map(|&(x, y)| (d2(x as i32, y as i32) as f32).sqrt())
            .collect()
    }
}

/// The script's pen thickness relative to its raw strokes, by weight (linear between the
/// font's own stops: Thin 0.6×, Light 1×, Regular 1.55×, Black 2.5×).
fn pen_factor(weight: f32) -> f32 {
    if weight < 270.0 {
        0.6 + (weight - 100.0) / 170.0 * 0.4
    } else if weight < 500.0 {
        1.0 + (weight - 270.0) / 230.0 * 0.55
    } else {
        1.55 + (weight - 500.0) / 400.0 * 0.95
    }
}

/// Atlas px to add to the outline for a pen of `weight` (the atlas is cut at weight 300).
pub(super) fn pen_offset(weight: f32) -> f32 {
    PEN_RAW * (pen_factor(weight) - pen_factor(300.0))
}

/// Mip levels the lettering is ever read at: the plate zooms out to 0.35, where an atlas pixel
/// is at most ~9 screen pixels' worth, so level 4 is the smallest the shader samples.
const ATLAS_LEVELS: usize = 5;

/// A box-filtered mip chain of an 8-bit image with `channels` interleaved, level 0 first, down
/// to 1×1 or `max_levels` levels, whichever comes first.
pub(crate) fn mips(
    level0: Vec<u8>,
    mut w: usize,
    mut h: usize,
    channels: usize,
    max_levels: usize,
) -> Vec<Vec<u8>> {
    let mut levels = vec![level0];
    while (w > 1 || h > 1) && levels.len() < max_levels {
        let (nw, nh) = ((w / 2).max(1), (h / 2).max(1));
        let prev = levels.last().expect("starts with level 0");
        let mut next = vec![0u8; nw * nh * channels];
        for y in 0..nh {
            for x in 0..nw {
                for c in 0..channels {
                    let mut sum = 0u32;
                    for (sx, sy) in [(0, 0), (1, 0), (0, 1), (1, 1)] {
                        let px = (x * 2 + sx).min(w - 1);
                        let py = (y * 2 + sy).min(h - 1);
                        sum += prev[(py * w + px) * channels + c] as u32;
                    }
                    next[(y * nw + x) * channels + c] = (sum / 4) as u8;
                }
            }
        }
        levels.push(next);
        (w, h) = (nw, nh);
    }
    levels
}

#[cfg(test)]
mod atlas_cost {
    #[test]
    fn build_time() {
        let titles: Vec<super::Title> = (0..136)
            .map(|i| super::Title {
                label: format!("A reasonably long title number {i} here"),
                href: Some("/x".into()),
                mark: super::Mark::Section(1),
            })
            .collect();
        let t = std::time::Instant::now();
        let a = super::TitleAtlas::build(&titles);
        eprintln!(
            "136 titles: {:?} atlas {}x{} levels {}",
            t.elapsed(),
            a.width,
            a.height,
            a.levels.len()
        );
        let t = std::time::Instant::now();
        let l0 = a.levels[0].clone();
        let _ = super::mips(
            l0,
            a.width as usize,
            a.height as usize,
            2,
            super::ATLAS_LEVELS,
        );
        eprintln!("mips alone {:?}", t.elapsed());
    }

    /// More titles than the strip holds: the ones past its end are left off, not wrapped over the first.
    #[test]
    fn overflow_is_left_off() {
        let titles: Vec<super::Title> = (0..400)
            .map(|i| super::Title {
                label: format!("A reasonably long title number {i} here"),
                href: Some("/x".into()),
                mark: super::Mark::Section(1),
            })
            .collect();
        let a = super::TitleAtlas::build(&titles);
        assert!(a.full);
        assert!(a.segs.len() < titles.len());
        assert!(
            a.segs
                .iter()
                .all(|s| s.x1 <= a.text_len && a.text_len as usize <= super::MAX_TEXT)
        );
        let few = super::TitleAtlas::build(&titles[..10]);
        assert!(!few.full);
        assert_eq!(few.segs.len(), 10);
    }
}
