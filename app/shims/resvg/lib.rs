#[cfg(not(target_family = "wasm"))]
pub use resvg_real::*;

#[cfg(target_family = "wasm")]
pub use tiny_skia;

#[cfg(target_family = "wasm")]
pub fn render(_: &usvg::Tree, _: tiny_skia::Transform, _: &mut tiny_skia::PixmapMut) {}
