//! Text selection for a gpui document drawn in one canvas: drag, double and triple click,
//! shift-click, Cmd/Ctrl+C and Cmd/Ctrl+A, long press with handles and a Copy pill on a phone,
//! and the browser's Edit > Copy on the web. Imports nothing from the app, so it can move
//! upstream next to `editable_text`.
//!
//! ```ignore
//! select::init(cx);                                   // once, at startup
//! let selection = Selection::new();                   // one per document, kept in its view
//! selection.scope(content_key, body, style)           // wraps the document; a new key clears
//! selection.text("plain")                             // one block, where a string child was
//! selection.styled(styled_text).links(ranges, open)   // links: a click follows, a drag selects
//! ```
//!
//! A block is a box of its own (one per paragraph), because its text must own a layout node to
//! be hit-tested. Copied text joins blocks with blank lines unless `.join` says otherwise.

mod element;
mod gesture;
mod keys;
mod model;
mod registry;
mod scope;
#[cfg(target_family = "wasm")]
mod web;

pub use element::Selectable;
pub use keys::init;
pub use model::Join;
pub use scope::{Selection, SelectionStyle};
