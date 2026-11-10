//! Paper and ink from the artifact, accents from @com: light and dark.

use gpui::{App, Global, Rgba, Window, WindowAppearance};

use crate::color::{Oklch, oklch};

/// headings in the reading column
pub const DISPLAY: &str = "Newsreader";
/// reading text
pub const BODY: &str = "Newsreader";
/// the interface: labels, the panels' controls and small metadata
pub const SANS: &str = "Inter";
/// titles in hand: Apple's hello script
pub const SCRIPT: &str = "Macintosh Skeletal";
pub const MONO: &str = "Lilex";

/// Faces to reach for when the one in use has no glyph (arrows, shapes and dingbats live in
/// Noto Sans Symbols 2). Set at each root; every text below inherits it.
pub fn with_fallbacks<E: gpui::Styled>(mut e: E) -> E {
    e.text_style().font_fallbacks = Some(gpui::FontFallbacks::from_fonts(vec![
        SANS.into(),
        "Noto Sans Symbols 2".into(),
    ]));
    e
}

/// A section's colour, 1–5 into `Theme::stops` (0: plain ink).
pub fn section_hue(slug: &str) -> u8 {
    match slug {
        "posts" => 1,
        "experiments" => 2,
        "elsewhere" | "feed" => 3,
        "recipes" => 4,
        "art" => 5,
        _ => 0,
    }
}

impl Theme {
    /// How selected text is shown: a wash of the accent, ink-on-paper for the phone's Copy pill.
    pub fn selection(&self) -> crate::select::SelectionStyle {
        let hsla = gpui::rgb_to_hsla;
        crate::select::SelectionStyle {
            highlight: hsla(Rgba {
                alpha: 0.28,
                ..self.accent
            }),
            handle: hsla(self.accent),
            pill_bg: hsla(self.ink),
            pill_fg: hsla(self.paper),
            copy_label: "Copy".into(),
        }
    }

    /// The colour of a section (its stop), or ink.
    pub fn section(&self, slug: &str) -> Rgba {
        match section_hue(slug) {
            0 => self.ink,
            h => self.stops[h as usize - 1],
        }
    }
}

/// The visitor's choice of paper: follow the system, or keep it light or dark.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Choice {
    #[default]
    System,
    Light,
    Dark,
}

impl Global for Choice {}

impl Choice {
    pub fn key(self) -> &'static str {
        match self {
            Choice::System => "system",
            Choice::Light => "light",
            Choice::Dark => "dark",
        }
    }

    pub fn from_key(key: &str) -> Self {
        match key {
            "light" => Choice::Light,
            "dark" => Choice::Dark,
            _ => Choice::System,
        }
    }
}

struct Inks {
    paper: Oklch,
    ink: Oklch,
    accent: Oklch,
    stops: [Oklch; 5],
    muted: Oklch,
    rule: Oklch,
}

const DARK: Inks = Inks {
    paper: oklch(0.185, 0.008, 67.3),
    ink: oklch(0.936, 0.02, 84.6),
    accent: oklch(0.813, 0.093, 263.6),
    stops: [
        oklch(0.789, 0.094, 263.5),
        oklch(0.8, 0.108, 157.2),
        oklch(0.829, 0.112, 84.2),
        oklch(0.782, 0.11, 42.2),
        oklch(0.798, 0.114, 317.0),
    ],
    muted: oklch(0.69, 0.023, 79.0),
    rule: oklch(0.32, 0.014, 76.4),
};

// warm paper, every stop held at 4.9:1 or better against it
const LIGHT: Inks = Inks {
    paper: oklch(0.953, 0.016, 86.4),
    ink: oklch(0.211, 0.009, 75.1),
    accent: oklch(0.483, 0.18, 262.2),
    stops: [
        oklch(0.512, 0.151, 265.4),
        oklch(0.5, 0.107, 156.2),
        oklch(0.518, 0.1036, 78.9),
        oklch(0.53, 0.141, 38.5),
        oklch(0.528, 0.153, 313.6),
    ],
    muted: oklch(0.486, 0.021, 78.1),
    rule: oklch(0.86, 0.024, 82.1),
};

#[derive(Clone, Copy, Debug)]
pub struct Theme {
    pub dark: bool,
    pub paper: Rgba,
    pub ink: Rgba,
    /// @com's blue, for links under the pointer, labels and the plate's headings
    pub accent: Rgba,
    /// @com's five selection stops (blue, green, ochre, terracotta, plum): sections' colours
    pub stops: [Rgba; 5],
    pub muted: Rgba,
    pub rule: Rgba,
}

impl Theme {
    /// The theme in force: the visitor's choice, else the system's appearance.
    pub fn of(window: &Window, cx: &App) -> Self {
        match cx.try_global::<Choice>().copied().unwrap_or_default() {
            Choice::Light => Self::for_appearance(WindowAppearance::Light),
            Choice::Dark => Self::for_appearance(WindowAppearance::Dark),
            Choice::System => Self::for_appearance(window.appearance()),
        }
    }

    pub fn for_appearance(appearance: WindowAppearance) -> Self {
        let dark = matches!(
            appearance,
            WindowAppearance::Dark | WindowAppearance::VibrantDark
        );
        let inks = if dark { &DARK } else { &LIGHT };
        Self {
            dark,
            paper: inks.paper.rgba(),
            ink: inks.ink.rgba(),
            accent: inks.accent.rgba(),
            stops: inks.stops.map(Oklch::rgba),
            muted: inks.muted.rgba(),
            rule: inks.rule.rgba(),
        }
    }

    /// the hairline round a control on the plate: ink, barely there
    pub fn edge(&self) -> Rgba {
        Rgba {
            alpha: if self.dark { 0.22 } else { 0.16 },
            ..self.ink
        }
    }

    /// paper at the given opacity, for panels that sit on the plate
    pub fn veil(&self, alpha: f32) -> Rgba {
        Rgba {
            alpha,
            ..self.paper
        }
    }

    /// a token as a CSS colour, for elements the browser draws over the canvas
    pub fn css(c: Rgba) -> String {
        let b = |v: f32| (v.clamp(0.0, 1.0) * 255.0).round();
        format!(
            "rgb({} {} {} / {})",
            b(c.color.red),
            b(c.color.green),
            b(c.color.blue),
            c.alpha
        )
    }

    /// a token as shader uniform: sRGB components, opaque
    pub fn uniform(c: Rgba) -> [f32; 4] {
        [c.color.red, c.color.green, c.color.blue, 1.0]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::color::{WHITE, hex, in_gamut};

    fn quantized(t: Theme) -> [u32; 10] {
        let [s1, s2, s3, s4, s5] = t.stops.map(hex);
        [
            hex(t.paper),
            hex(t.ink),
            hex(t.accent),
            s1,
            s2,
            s3,
            s4,
            s5,
            hex(t.muted),
            hex(t.rule),
        ]
    }

    #[test]
    fn dark_oklch_tokens_render_the_hex_the_site_shipped() {
        assert_eq!(
            quantized(Theme::for_appearance(WindowAppearance::Dark)),
            [
                0x15120F, 0xF0E9DB, 0xA3C2FF, 0x9BBAF7, 0x7FD3A2, 0xE9C16E, 0xF4A07F, 0xDBA6EE,
                0xA39A8C, 0x37322B,
            ]
        );
    }

    #[test]
    fn light_oklch_tokens_render_the_hex_the_site_shipped() {
        assert_eq!(
            quantized(Theme::for_appearance(WindowAppearance::Light)),
            [
                0xF4EFE4, 0x1B1814, 0x1F55C2, 0x3C60BC, 0x1F7549, 0x88600C, 0xAD4826, 0x8A4BA8,
                0x665E52, 0xD9D0C0,
            ]
        );
    }

    #[test]
    fn every_token_sits_inside_srgb_without_clamping() {
        for inks in [&DARK, &LIGHT] {
            let all = [
                inks.paper,
                inks.ink,
                inks.accent,
                inks.muted,
                inks.rule,
                WHITE,
            ]
            .into_iter()
            .chain(inks.stops);
            for c in all {
                assert!(in_gamut(c), "{c:?} leaves sRGB");
            }
        }
    }
}
