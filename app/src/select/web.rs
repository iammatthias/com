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
