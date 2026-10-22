//! The browser's own copy paths. Edit > Copy fires a `copy` event on the focused element (gpui's
//! hidden IME textarea), which a document-level listener answers with the selection. No DOM
//! element is ever focused or given a DOM selection: gpui's keyboard lives on that textarea.

use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::Closure;

use super::scope::Selection;

fn selected_text() -> Option<String> {
    Selection::active()?.selected_text()
}

pub fn install() {
    let Some(document) = web_sys::window().and_then(|w| w.document()) else {
        return;
    };
    // a cancelled beforecopy is what enables the Copy menu item while nothing in the DOM is
    // selected
    let before = Closure::<dyn FnMut(web_sys::Event)>::new(|e: web_sys::Event| {
        if selected_text().is_some() {
            e.prevent_default();
        }
    });
    let copy = Closure::<dyn FnMut(web_sys::Event)>::new(|e: web_sys::Event| {
        let Some(text) = selected_text() else {
            return;
        };
        let Some(data) = e
            .dyn_ref::<web_sys::ClipboardEvent>()
            .and_then(|e| e.clipboard_data())
        else {
            return;
        };
        if data.set_data("text/plain", &text).is_ok() {
            e.prevent_default();
        }
    });
    for (name, closure) in [("beforecopy", &before), ("copy", &copy)] {
        let _ = document.add_event_listener_with_callback(name, closure.as_ref().unchecked_ref());
    }
    before.forget();
    copy.forget();
}

/// The selection's geometry as JSON, for browser tests that cannot read the canvas: the text,
/// its highlight rects, and where the Copy pill sits.
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn selection_debug() -> String {
    let Some(scope) = Selection::active() else {
        return "{}".into();
    };
    let rects = scope.rects();
    let rect = |r: &gpui::Bounds<gpui::Pixels>| {
        format!(
            "[{},{},{},{}]",
            f32::from(r.origin.x),
            f32::from(r.origin.y),
            f32::from(r.size.width),
            f32::from(r.size.height)
        )
    };
    let pill = rects
        .first()
        .map(|r| {
            format!(
                "[{},{}]",
                f32::from(r.origin.x),
                f32::from(r.origin.y - super::scope::PILL_LIFT)
            )
        })
        .unwrap_or_else(|| "null".into());
    let text = scope.selected_text().unwrap_or_default();
    let escaped: String = text.chars().flat_map(|c| c.escape_default()).collect();
    format!(
        "{{\"text\":\"{escaped}\",\"rects\":[{}],\"pill\":{pill}}}",
        rects.iter().map(rect).collect::<Vec<_>>().join(",")
    )
}
