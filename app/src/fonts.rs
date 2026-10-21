//! The site's faces. On the web they're separate files beside the app (preloaded by the page,
//! cached for a year, untouched by a new build of the app) and fetched before the window
//! opens; natively, and in tests, they're built in.
//!
//! To change a face: replace its file in assets/fonts, then bump `DIR` here and in index.html's
//! preloads, so browsers fetch the new one.

use std::borrow::Cow;
use std::sync::OnceLock;

/// Where the faces are served: versioned, so a changed face is a new URL.
pub const DIR: &str = "/fonts-v1";

/// Every face, by file name, in the order they're registered.
pub const FILES: [&str; 6] = [
    "Newsreader.ttf",
    "Newsreader-Italic.ttf",
    "Inter.ttf",
    "Inter-Italic.ttf",
    "NotoSansSymbols2.ttf",
    "MacintoshSkeletal.otf",
];

/// The one face the site can do without: a symbol it lacks falls back to the system's.
pub const OPTIONAL: &str = "NotoSansSymbols2.ttf";

static LOADED: OnceLock<Vec<&'static [u8]>> = OnceLock::new();

/// Keep the fetched faces for the life of the app (they're read by the plate, the greeting and
/// the diagrams as well as the text system). A face that didn't come stays empty.
pub fn set(faces: Vec<Option<Vec<u8>>>) {
    let _ = LOADED.set(
        faces
            .into_iter()
            .map(|f| &*Box::leak(f.unwrap_or_default().into_boxed_slice()))
            .collect(),
    );
}

fn face(name: &str) -> &'static [u8] {
    if let Some(i) = FILES.iter().position(|f| *f == name) {
        if let Some(bytes) = LOADED.get().and_then(|l| l.get(i)) {
            return bytes;
        }
    }
    built_in(name)
}

/// Apple's hello script, for the plate's lettering and the greeting.
pub fn script() -> &'static [u8] {
    face("MacintoshSkeletal.otf")
}

/// Inter, which the diagrams carry inline.
pub fn sans() -> &'static [u8] {
    face("Inter.ttf")
}

/// Every face, for the text system (less any that didn't come).
pub fn all() -> Vec<Cow<'static, [u8]>> {
    let mut out: Vec<Cow<'static, [u8]>> = FILES
        .iter()
        .map(|f| face(f))
        .filter(|f| !f.is_empty())
        .map(Cow::Borrowed)
        .collect();
    out.push(Cow::Borrowed(*gpui_fonts::LILEX));
    out
}

#[cfg(not(target_family = "wasm"))]
fn built_in(name: &str) -> &'static [u8] {
    match name {
        "Newsreader.ttf" => include_bytes!("../assets/fonts/Newsreader.ttf"),
        "Newsreader-Italic.ttf" => include_bytes!("../assets/fonts/Newsreader-Italic.ttf"),
        "Inter.ttf" => include_bytes!("../assets/fonts/Inter.ttf"),
        "Inter-Italic.ttf" => include_bytes!("../assets/fonts/Inter-Italic.ttf"),
        "NotoSansSymbols2.ttf" => include_bytes!("../assets/fonts/NotoSansSymbols2.ttf"),
        "MacintoshSkeletal.otf" => include_bytes!("../assets/fonts/MacintoshSkeletal.otf"),
        _ => &[],
    }
}

#[cfg(target_family = "wasm")]
fn built_in(_: &str) -> &'static [u8] {
    &[]
}
