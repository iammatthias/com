//! The plate is written out more than once: its shader (plate.wgsl), its CPU mirrors here, the
//! social card's copy of both (card/card.js), and its palette in every page the browser draws
//! before the app does. These tests read those copies and fail when one drifts from the Rust.

use super::atlas::{FONT, SPREAD};
use super::geom::{FACE_CLEAR, SUBJECT};
use super::gpu::Uniforms;
use super::{CONTROLS, LIFT};
use crate::theme::Theme;

fn read(path: &str) -> String {
    let full = format!("{}/{path}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&full).unwrap_or_else(|e| panic!("{full}: {e}"))
}

/// The number after `name =` (or `name:`) in `src`, the first time it's set.
fn number(src: &str, name: &str) -> f32 {
    for sep in [" = ", ": f32 = ", ": "] {
        let key = format!("{name}{sep}");
        if let Some(at) = src.find(&key) {
            let rest = &src[at + key.len()..];
            let end = rest
                .find(|c: char| !(c.is_ascii_digit() || c == '.' || c == '-'))
                .unwrap_or(rest.len());
            if let Ok(v) = rest[..end].parse() {
                return v;
            }
        }
    }
    panic!("{name} not found");
}

#[test]
fn the_shader_and_the_cpu_agree_on_the_constants() {
    let wgsl = read("src/plate.wgsl");
    assert_eq!(number(&wgsl, "const SUBJECT"), SUBJECT);
    assert_eq!(number(&wgsl, "const FACE_CLEAR"), FACE_CLEAR);
    assert_eq!(number(&wgsl, "const SPREAD"), SPREAD);
}

#[test]
fn the_card_agrees_with_the_plate() {
    let card = read("card/card.js");
    assert_eq!(number(&card, "LIFT"), LIFT);
    assert_eq!(number(&card, "SUBJECT"), SUBJECT);
    assert_eq!(number(&card, "const FONT"), FONT);
    for (name, value) in [
        ("warp", CONTROLS.warp),
        ("disp", CONTROLS.disp),
        ("ab", CONTROLS.ab),
        ("flare", CONTROLS.flare),
        ("haze", CONTROLS.haze),
    ] {
        assert_eq!(number(&card, name), value, "CONTROLS.{name}");
    }
    let slots = std::mem::size_of::<Uniforms>() / 16;
    assert!(
        card.contains(&format!("new Float32Array({slots} * 4)")),
        "card.js fills {slots} vec4 slots"
    );
}

/// The lines between `open` and the next line starting `close`, trimmed, comments dropped.
fn block<'a>(src: &'a str, open: &str, close: &str) -> Vec<&'a str> {
    let at = src.find(open).unwrap_or_else(|| panic!("{open} not found"));
    src[at + open.len()..]
        .lines()
        .map(str::trim)
        .take_while(|l| !l.starts_with(close))
        .map(|l| l.split("//").next().unwrap().trim())
        .filter(|l| !l.is_empty())
        .collect()
}

/// plate.wgsl's `struct U`, in order: each field and the vec4 slot it starts at.
fn shader_slots() -> (Vec<(String, usize)>, usize) {
    let wgsl = read("src/plate.wgsl");
    let mut at = 0;
    let mut fields = Vec::new();
    for line in block(&wgsl, "struct U {", "};") {
        let (name, ty) = line
            .trim_end_matches(',')
            .split_once(':')
            .unwrap_or_else(|| panic!("struct U: {line}"));
        let ty = ty.trim();
        let n = if ty == "vec4<f32>" {
            1
        } else {
            let n = ty
                .strip_prefix("array<vec4<f32>,")
                .and_then(|r| r.strip_suffix('>'))
                .unwrap_or_else(|| panic!("struct U: a {ty}"));
            n.trim().parse().unwrap()
        };
        fields.push((name.trim().to_string(), at));
        at += n;
    }
    (fields, at)
}

#[test]
fn the_uniforms_are_laid_out_alike_in_rust_wgsl_and_the_card() {
    let (shader, slots) = shader_slots();
    assert_eq!(
        slots,
        std::mem::size_of::<Uniforms>() / 16,
        "struct U and Uniforms differ in size"
    );
    let names: Vec<&str> = shader.iter().map(|(n, _)| n.as_str()).collect();
    let gpu = read("src/plate/gpu.rs");
    let rust: Vec<&str> = block(&gpu, "pub(super) struct Uniforms {", "}")
        .into_iter()
        .filter(|l| !l.starts_with("///"))
        .map(|l| l.split(':').next().unwrap().trim())
        .collect();
    assert_eq!(
        rust, names,
        "Uniforms (gpu.rs) and struct U (plate.wgsl) name their fields in a different order"
    );
    let card = read("card/card.js");
    let table: Vec<(String, usize)> = block(&card, "const SLOT = {", "};")
        .iter()
        .flat_map(|l| l.split(','))
        .filter_map(|kv| kv.split_once(':'))
        .map(|(k, v)| (k.trim().to_string(), v.trim().parse().unwrap()))
        .collect();
    assert_eq!(table, shader, "card.js's SLOT table and struct U disagree");
}

fn hex(c: gpui::Rgba) -> String {
    let b = |v: f32| (v * 255.0).round() as u8;
    format!(
        "#{:02x}{:02x}{:02x}",
        b(c.color.red),
        b(c.color.green),
        b(c.color.blue)
    )
}

#[test]
fn every_page_drawn_before_the_app_uses_the_theme() {
    let light = Theme::for_appearance(gpui::WindowAppearance::Light);
    let dark = Theme::for_appearance(gpui::WindowAppearance::Dark);
    // the paper: the page's own background, and the browser chrome's tint
    let pages = [
        ("index.html", read("index.html")),
        ("seo.ts", read("../worker/src/lib/seo.ts")),
    ];
    for (name, src) in &pages {
        let src = src.to_lowercase();
        for c in [hex(light.paper), hex(dark.paper)] {
            assert!(src.contains(&c), "{name} lacks the paper colour {c}");
        }
    }
    let shell = read("../worker/src/lib/shell.ts").to_lowercase();
    // the plain page's text and links
    for c in [
        hex(light.ink),
        hex(dark.ink),
        hex(light.accent),
        hex(dark.accent),
    ] {
        assert!(shell.contains(&c), "shell.ts lacks the colour {c}");
    }
    let card = read("card/card.js").to_lowercase();
    for c in [light.paper, light.ink, light.accent] {
        let js = hex(c).replace('#', "0x");
        assert!(card.contains(&js), "card.js lacks {js}");
    }
}
