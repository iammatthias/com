//! resvg as the site builds it (see shims/usvg/Cargo.toml).

#[cfg(not(target_family = "wasm"))]
pub use resvg_real::*;

#[cfg(target_family = "wasm")]
pub use tiny_skia;

/// On the web nothing reaches here (the parser declines every document).
#[cfg(target_family = "wasm")]
pub fn render(_: &usvg::Tree, _: tiny_skia::Transform, _: &mut tiny_skia::PixmapMut) {}
