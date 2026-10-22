//! Paper and ink from the artifact, accents from @com: light and dark.

use gpui::{App, Global, Rgba, Window, WindowAppearance, rgb};

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
        if dark {
            Self {
                dark,
                paper: rgb(0x15120F),
                ink: rgb(0xF0E9DB),
                accent: rgb(0xA3C2FF),
                stops: [
                    rgb(0x9BBAF7),
                    rgb(0x7FD3A2),
                    rgb(0xE9C16E),
                    rgb(0xF4A07F),
                    rgb(0xDBA6EE),
                ],
                muted: rgb(0xA39A8C),
                rule: rgb(0x37322B),
            }
        } else {
            Self {
                dark,
                // warm paper, every stop held at 4.9:1 or better against it
                paper: rgb(0xF4EFE4),
                ink: rgb(0x1B1814),
                accent: rgb(0x1F55C2),
                stops: [
                    rgb(0x3C60BC),
                    rgb(0x1F7549),
                    rgb(0x88600C),
                    rgb(0xAD4826),
                    rgb(0x8A4BA8),
                ],
                muted: rgb(0x665E52),
                rule: rgb(0xD9D0C0),
            }
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
