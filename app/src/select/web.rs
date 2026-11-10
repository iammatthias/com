use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::Closure;

use super::scope::Selection;

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

pub fn has_clipboard_api() -> bool {
    web_sys::window().is_some_and(|w| {
        js_sys::Reflect::get(&w.navigator(), &"clipboard".into()).is_ok_and(|v| !v.is_undefined())
    })
}

pub fn copy_by_command() {
    let document = web_sys::window()
        .and_then(|w| w.document())
        .and_then(|d| d.dyn_into::<web_sys::HtmlDocument>().ok());
    if let Some(document) = document {
        let _ = document.exec_command("copy");
    }
}

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
    let text = serde_json::Value::String(scope.selected_text().unwrap_or_default());
    format!(
        "{{\"text\":{text},\"rects\":[{}],\"pill\":{pill}}}",
        rects.iter().map(rect).collect::<Vec<_>>().join(",")
    )
}
