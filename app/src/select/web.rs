//! The browser's own copy paths. Edit > Copy fires a `copy` event on the focused element (gpui's
//! hidden IME textarea), which a document-level listener answers with the selection. No DOM
//! element is ever focused or given a DOM selection: gpui's keyboard lives on that textarea.

use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::Closure;

use super::scope::Selection;

/// The selection a copy command should take, unless a DOM field (an app's own input) has the
/// focus and a selection of its own: that copy is the field's. gpui's IME textarea is always
/// empty, so it never claims one.
fn selected_text(document: &web_sys::Document) -> Option<String> {
    let focused = document.active_element()?;
    let field_selected = |start: Option<u32>, end: Option<u32>| start != end;
    let own = if let Some(input) = focused.dyn_ref::<web_sys::HtmlInputElement>() {
        field_selected(input.selection_start().ok()?, input.selection_end().ok()?)
    } else if let Some(area) = focused.dyn_ref::<web_sys::HtmlTextAreaElement>() {
        field_selected(area.selection_start().ok()?, area.selection_end().ok()?)
    } else {
        false
    };
    if own {
        return None;
    }
    Selection::active()?.selected_text()
}

pub fn install() {
    let Some(document) = web_sys::window().and_then(|w| w.document()) else {
        return;
    };
    // a cancelled beforecopy is what enables the Copy menu item while nothing in the DOM is
    // selected
    let doc = document.clone();
    let before = Closure::<dyn FnMut(web_sys::Event)>::new(move |e: web_sys::Event| {
        if selected_text(&doc).is_some() {
            e.prevent_default();
        }
    });
    let doc = document.clone();
    let copy = Closure::<dyn FnMut(web_sys::Event)>::new(move |e: web_sys::Event| {
        let Some(text) = selected_text(&doc) else {
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
/// its highlight rects, and where the Copy pill was drawn (null when it wasn't).
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
    let pill = scope
        .pill()
        .map(|p| format!("[{},{}]", f32::from(p.x), f32::from(p.y)))
        .unwrap_or_else(|| "null".into());
    let text = scope.selected_text().unwrap_or_default();
    let escaped: String = text.chars().flat_map(|c| c.escape_default()).collect();
    format!(
        "{{\"text\":\"{escaped}\",\"rects\":[{}],\"pill\":{pill}}}",
        rects.iter().map(rect).collect::<Vec<_>>().join(",")
    )
}
