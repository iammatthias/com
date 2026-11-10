use std::borrow::Cow;
use std::sync::OnceLock;

pub const DIR: &str = "/fonts-v1";

pub const FILES: [&str; 6] = [
    "Newsreader.ttf",
    "Newsreader-Italic.ttf",
    "Inter.ttf",
    "Inter-Italic.ttf",
    "NotoSansSymbols2.ttf",
    "MacintoshSkeletal.otf",
];

pub const OPTIONAL: &str = "NotoSansSymbols2.ttf";

static LOADED: OnceLock<Vec<&'static [u8]>> = OnceLock::new();

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

pub fn script() -> &'static [u8] {
    face("MacintoshSkeletal.otf")
}

pub fn sans() -> &'static [u8] {
    face("Inter.ttf")
}

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
