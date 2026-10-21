//! The terrazzo banner at the foot of a record, ported from @com (`src/scripts/terrazzo.ts`):
//! the same palettes, styles, random streams and draw order, so a record keeps its pattern.
//! Seeded by `hash("<rkey>:<cid>")`. Rasterized once into an image (chips are polygons,
//! filled with zeno) rather than painted as hundreds of paths on every frame.

use std::cell::RefCell;
use std::sync::Arc;

use gpui::RenderImage;
use swash::zeno::{Command, Mask, PathBuilder};

const PALETTES: [&[&str]; 8] = [
    &[
        "#f1ece1", "#1a1a1a", "#8b3a2f", "#cb6a4f", "#5a5247", "#a6a097", "#d4c8a8",
    ], // Bianco
    &[
        "#e8f0e6", "#2d4a3e", "#5a8c7e", "#a8c8b8", "#f4a896", "#1a1a1a", "#d9c9a8",
    ], // Mint
    &[
        "#f6e6e0", "#7a3a3a", "#d9847c", "#3a2a28", "#c9a89a", "#e8c9a8", "#a06864",
    ], // Rose
    &[
        "#e8e6e2", "#1a1a1a", "#3a3a3a", "#6c6c6a", "#a0a09c", "#bcbab5",
    ], // Carbon
    &[
        "#f4ead8", "#2d6e3e", "#f2a83b", "#d94f3e", "#1a3a4a", "#8c5a3e", "#e8d9a8",
    ], // Tropic
    &[
        "#1a1a1a", "#f1ece1", "#cb6a4f", "#5a8c7e", "#d4c8a8", "#7a7a7a", "#3a3a3a",
    ], // Ink
    &[
        "#efe7d6", "#a82a1f", "#1a1a1a", "#e8a878", "#5a3a2a", "#d9c9a8",
    ], // Rosso
    &[
        "#e6eef0", "#0e3a4a", "#3a8ca0", "#a8d0d8", "#1a1a1a", "#d9c9a8", "#cb6a4f",
    ], // Acqua
];

#[derive(Clone, Copy)]
struct Style {
    palladiana: bool,
    density: f64,
    min_size: f64,
    max_size: f64,
    sides: f64,
    chaos: f64,
    size_bias: f64,
}

const STYLES: [Style; 5] = [
    Style {
        palladiana: false,
        density: 220.0,
        min_size: 6.0,
        max_size: 80.0,
        sides: 6.0,
        chaos: 55.0,
        size_bias: 2.2,
    }, // Venetian
    Style {
        palladiana: true,
        density: 110.0,
        min_size: 4.0,
        max_size: 130.0,
        sides: 6.0,
        chaos: 35.0,
        size_bias: 2.5,
    }, // Palladiana
    Style {
        palladiana: false,
        density: 460.0,
        min_size: 3.0,
        max_size: 18.0,
        sides: 6.0,
        chaos: 50.0,
        size_bias: 1.5,
    }, // Micro
    Style {
        palladiana: false,
        density: 200.0,
        min_size: 5.0,
        max_size: 90.0,
        sides: 4.0,
        chaos: 78.0,
        size_bias: 2.0,
    }, // Shards
    Style {
        palladiana: false,
        density: 130.0,
        min_size: 8.0,
        max_size: 60.0,
        sides: 9.0,
        chaos: 22.0,
        size_bias: 1.8,
    }, // Pebble
];

/// mulberry32 in full precision, so a seed draws exactly what it draws in JS.
struct Rng(u32);

impl Rng {
    fn next(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6D2B79F5);
        let mut t = self.0;
        t = (t ^ (t >> 15)).wrapping_mul(t | 1);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
        (t ^ (t >> 14)) as f64 / 4294967296.0
    }
}

type Rgb = [f64; 3];

fn hex(h: &str) -> Rgb {
    let n = u32::from_str_radix(&h[1..], 16).unwrap_or(0);
    [
        ((n >> 16) & 255) as f64 / 255.0,
        ((n >> 8) & 255) as f64 / 255.0,
        (n & 255) as f64 / 255.0,
    ]
}
fn to_linear(c: f64) -> f64 {
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}
fn to_srgb(c: f64) -> f64 {
    if c <= 0.0031308 {
        c * 12.92
    } else {
        1.055 * c.powf(1.0 / 2.4) - 0.055
    }
}
fn rgb_to_hsl([r, g, b]: Rgb) -> Rgb {
    let (max, min) = (r.max(g).max(b), r.min(g).min(b));
    let l = (max + min) / 2.0;
    if max == min {
        return [0.0, 0.0, l];
    }
    let d = max - min;
    let s = if l <= 0.5 {
        d / (max + min)
    } else {
        d / (2.0 - max - min)
    };
    let h = if max == r {
        (g - b) / d + if g < b { 6.0 } else { 0.0 }
    } else if max == g {
        (b - r) / d + 2.0
    } else {
        (r - g) / d + 4.0
    };
    [h / 6.0, s, l]
}
fn hue2rgb(p: f64, q: f64, mut t: f64) -> f64 {
    if t < 0.0 {
        t += 1.0;
    }
    if t > 1.0 {
        t -= 1.0;
    }
    if t < 1.0 / 6.0 {
        p + (q - p) * 6.0 * t
    } else if t < 0.5 {
        q
    } else if t < 2.0 / 3.0 {
        p + (q - p) * 6.0 * (2.0 / 3.0 - t)
    } else {
        p
    }
}
fn hsl_to_rgb([h, s, l]: Rgb) -> Rgb {
    if s == 0.0 {
        return [l, l, l];
    }
    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };
    let p = 2.0 * l - q;
    [
        hue2rgb(p, q, h + 1.0 / 3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0 / 3.0),
    ]
}
/// linear → 8-bit sRGB, as @com's `cssColor`
fn css([r, g, b]: Rgb) -> [u8; 3] {
    let to = |c: f64| (to_srgb(c) * 255.0).round().clamp(0.0, 255.0) as u8;
    [to(r), to(g), to(b)]
}

fn jitter(h: &str, rng: &mut Rng) -> [u8; 3] {
    let lin = hex(h).map(to_linear);
    let [hh, s, l] = rgb_to_hsl(lin);
    let hh = (hh + (rng.next() - 0.5) * 0.025 + 1.0) % 1.0;
    let s = (s + (rng.next() - 0.5) * 0.1).clamp(0.0, 1.0);
    let l = (l + (rng.next() - 0.5) * 0.07).clamp(0.0, 1.0);
    css(hsl_to_rgb([hh, s, l]))
}

struct Chip {
    cx: f64,
    cy: f64,
    r: f64,
    n: usize,
    irr: f64,
    color: usize,
    sub: u32,
}

fn chip_verts(c: &Chip, rng: &mut Rng) -> Vec<(f64, f64)> {
    let step = std::f64::consts::TAU / c.n as f64;
    let off = rng.next() * std::f64::consts::TAU;
    (0..c.n)
        .map(|i| {
            let angle = off + i as f64 * step + (rng.next() - 0.5) * step * c.irr * 0.7;
            let r = c.r * (1.0 - c.irr * 0.45 + rng.next() * c.irr * 0.55);
            (c.cx + angle.cos() * r, c.cy + angle.sin() * r)
        })
        .collect()
}

/// BGRA pixels, `w`×`h`, opaque.
struct Canvas {
    w: usize,
    h: usize,
    px: Vec<u8>,
}

impl Canvas {
    fn fill(&mut self, path: &[Command], [r, g, b]: [u8; 3]) {
        let (mask, place) = Mask::new(path).render();
        for y in 0..place.height as i32 {
            let py = place.top + y;
            if py < 0 || py as usize >= self.h {
                continue;
            }
            for x in 0..place.width as i32 {
                let px = place.left + x;
                if px < 0 || px as usize >= self.w {
                    continue;
                }
                let a = mask[(y as u32 * place.width + x as u32) as usize] as u32;
                if a == 0 {
                    continue;
                }
                let i = (py as usize * self.w + px as usize) * 4;
                let blend =
                    |d: u8, s: u8| ((d as u32 * (255 - a) + s as u32 * a + 127) / 255) as u8;
                self.px[i] = blend(self.px[i], b);
                self.px[i + 1] = blend(self.px[i + 1], g);
                self.px[i + 2] = blend(self.px[i + 2], r);
            }
        }
    }
}

/// The banner for `seed` at `width`×`height` css px, drawn at `ratio` device px each.
fn paint(seed: u32, width: f64, height: f64, ratio: f64) -> Canvas {
    let (w, h) = (
        (width * ratio).round().max(1.0) as usize,
        (height * ratio).round().max(1.0) as usize,
    );
    let aspect = width / height;
    let mut pick = Rng(seed);
    let pal = PALETTES[(pick.next() * PALETTES.len() as f64) as usize];
    let style = STYLES[(pick.next() * STYLES.len() as f64) as usize];

    let ground = hex(pal[0]);
    let g8 = ground.map(|c| (c * 255.0).round() as u8);
    let mut canvas = Canvas {
        w,
        h,
        px: [g8[2], g8[1], g8[0], 255].repeat(w * h),
    };
    // css px → device px, y up in the pattern's space
    let at = |x: f64, y: f64| {
        [
            ((x + aspect / 2.0) * height * ratio) as f32,
            ((0.5 - y) * height * ratio) as f32,
        ]
    };

    let chips_pal = &pal[1..];
    let min_size = style.min_size / 1000.0;
    let max_size = (style.max_size / 1000.0).max(min_size + 0.005);
    let mut rng = Rng(seed);
    let density = (style.density * (aspect * 0.6).max(1.0)).round() as usize;
    let mut chips = Vec::new();
    let sides =
        |rng: &mut Rng| (style.sides + ((rng.next() - 0.5) * 3.0).floor()).max(3.0) as usize;
    if style.palladiana {
        let big = 9 + (rng.next() * 8.0).floor() as usize;
        for _ in 0..big {
            chips.push(Chip {
                cx: (rng.next() - 0.5) * aspect,
                cy: (rng.next() - 0.5),
                r: max_size * (0.65 + rng.next() * 0.55),
                n: 4 + (rng.next() * 3.0).floor() as usize,
                irr: style.chaos / 100.0 * 0.4,
                color: (rng.next() * chips_pal.len() as f64) as usize,
                sub: (rng.next() * 1e9).floor() as u32,
            });
        }
        for _ in 0..density {
            let t = rng.next().powf(style.size_bias);
            chips.push(Chip {
                cx: (rng.next() - 0.5) * aspect * 1.05,
                cy: (rng.next() - 0.5) * 1.05,
                r: min_size + t * (max_size * 0.25 - min_size),
                n: sides(&mut rng),
                irr: style.chaos / 100.0,
                color: (rng.next() * chips_pal.len() as f64) as usize,
                sub: (rng.next() * 1e9).floor() as u32,
            });
        }
    } else {
        for _ in 0..density {
            let t = rng.next().powf(style.size_bias);
            chips.push(Chip {
                cx: (rng.next() - 0.5) * aspect * 1.05,
                cy: (rng.next() - 0.5) * 1.05,
                r: min_size + t * (max_size - min_size),
                n: sides(&mut rng),
                irr: style.chaos / 100.0,
                color: (rng.next() * chips_pal.len() as f64) as usize,
                sub: (rng.next() * 1e9).floor() as u32,
            });
        }
    }
    // largest first, as the JS sort (stable, descending radius)
    chips.sort_by(|a, b| b.r.partial_cmp(&a.r).unwrap_or(std::cmp::Ordering::Equal));

    let mut path: Vec<Command> = Vec::new();
    for c in &chips {
        let mut local = Rng(c.sub);
        let verts = chip_verts(c, &mut local);
        let color = jitter(chips_pal[c.color.min(chips_pal.len() - 1)], &mut local);
        path.clear();
        path.move_to(at(verts[0].0, verts[0].1));
        for v in &verts[1..] {
            path.line_to(at(v.0, v.1));
        }
        path.close();
        canvas.fill(&path, color);
    }

    // grit: specks of the ground, darkened
    let grit = 200 + (rng.next() * 400.0).floor() as usize;
    let speck = css(ground.map(|c| to_linear(c) * 0.55));
    for _ in 0..grit {
        let (x, y, s) = (rng.next() - 0.5, rng.next() - 0.5, 0.4 + rng.next() * 1.4);
        path.clear();
        path.add_circle(at(x * aspect, y), (0.0018 * s * height * ratio) as f32);
        canvas.fill(&path, speck);
    }
    canvas
}

thread_local! {
    /// the last few banners drawn, by seed and size
    static CACHE: RefCell<Vec<((u32, u32, u32), Arc<RenderImage>)>> = const { RefCell::new(Vec::new()) };
}

/// The banner image for a record: drawn on first use, then kept while it's among the last few.
/// Returns the evicted image too, so the caller can free its GPU copy.
pub fn banner(
    seed: u32,
    width: f32,
    height: f32,
    ratio: f32,
) -> (Arc<RenderImage>, Option<Arc<RenderImage>>) {
    let ratio = ratio.clamp(1.0, 2.0);
    let key = (seed, width.round() as u32, height.round() as u32);
    CACHE.with(|cache| {
        let mut cache = cache.borrow_mut();
        if let Some((_, img)) = cache.iter().find(|(k, _)| *k == key) {
            return (img.clone(), None);
        }
        let c = paint(seed, key.1 as f64, key.2 as f64, ratio as f64);
        let buffer = image::RgbaImage::from_raw(c.w as u32, c.h as u32, c.px).expect("banner size");
        let img = Arc::new(RenderImage::new(vec![image::Frame::new(buffer)]));
        cache.push((key, img.clone()));
        let evicted = (cache.len() > 3).then(|| cache.remove(0).1);
        (img, evicted)
    })
}
