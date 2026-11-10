//! "Find a title" is a real `<input>` laid over the canvas where the field is drawn: the browser
//! gives it what a canvas can't, i.e. the caret, selection, paste, autocorrect, IME and a phone's
//! keyboard. The field's box is drawn on the canvas; the input sits in it, transparent, and its
//! text is the query. It is focused inside the tap that opens Find (a phone raises its keyboard
//! only for focus given within a tap), placed at each paint, and hidden when Find is closed.

use std::cell::RefCell;

use crate::overlay::{Extent, Gate, Layer, Rect};
use crate::site::signal::Signal;

/// What the input tells the site.
pub enum Event {
    /// the text changed (typed, pasted, composed, autocorrected)
    Text(String),
    /// Enter: open the first result
    Submit,
    /// Escape: clear the query, or close Find when it's already empty
    Escape,
}

thread_local! {
    static EVENTS: Signal<Event> = const { Signal::new() };
    static PLACED: RefCell<Layer<()>> = RefCell::new(Layer::new(Gate::Lightbox, Extent::Viewport));
}

const FIELD: &str = "find";

/// The input's events, for the site to apply.
pub fn subscribe() -> futures::channel::mpsc::UnboundedReceiver<Event> {
    let rx = EVENTS.with(Signal::subscribe);
    web::on_event(|kind, text| {
        let event = match kind {
            "submit" => Event::Submit,
            "escape" => Event::Escape,
            _ => Event::Text(text),
        };
        EVENTS.with(|e| e.send(event));
    });
    rx
}

/// Where the field is painted this frame. `style` is the input's CSS: the site's ink and face.
pub fn place(rect: Rect, clip: Rect, placeholder: &str, max_len: usize, style: &str) {
    let inset = PLACED.with(|placed| {
        let mut placed = placed.borrow_mut();
        placed.place(FIELD, || ());
        placed.inset(rect, clip).filter(|_| !placed.gated())
    });
    match inset {
        Some(inset) => web::place(rect, inset, placeholder, max_len, style),
        None => web::hide(),
    }
}

/// A render of the controls begins: a field not painted since the last one (Find closed) goes.
pub fn begin_render() {
    if !PLACED.with(|placed| placed.borrow_mut().begin()).is_empty() {
        web::hide();
    }
}

/// Focus the field now (call from the tap or key that opens Find).
pub fn focus() {
    web::focus();
}

pub fn focused() -> bool {
    web::focused()
}

pub fn clear() {
    web::clear();
}

#[cfg(target_family = "wasm")]
mod web {
    use super::Rect;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen(module = "/js/dom.js")]
    extern "C" {
        #[wasm_bindgen(js_name = findPlace)]
        fn find_place(
            x: f32,
            y: f32,
            w: f32,
            h: f32,
            t: f32,
            r: f32,
            b: f32,
            l: f32,
            placeholder: &str,
            max_len: u32,
            style: &str,
        );
        #[wasm_bindgen(js_name = findFocus)]
        fn find_focus();
        #[wasm_bindgen(js_name = findFocused)]
        fn find_focused() -> bool;
        #[wasm_bindgen(js_name = findClear)]
        fn find_clear();
        #[wasm_bindgen(js_name = findHide)]
        fn find_hide();
        #[wasm_bindgen(js_name = findEvents)]
        fn find_events(cb: &Closure<dyn Fn(String, String)>);
    }

    pub fn place(
        rect: Rect,
        [t, r, b, l]: [f32; 4],
        placeholder: &str,
        max_len: usize,
        style: &str,
    ) {
        find_place(
            rect.x,
            rect.y,
            rect.w,
            rect.h,
            t,
            r,
            b,
            l,
            placeholder,
            max_len as u32,
            style,
        );
    }
    pub fn focus() {
        find_focus();
    }
    pub fn focused() -> bool {
        find_focused()
    }
    pub fn clear() {
        find_clear();
    }
    pub fn hide() {
        find_hide();
    }
    pub fn on_event(f: impl Fn(&str, String) + 'static) {
        let cb = Closure::<dyn Fn(String, String)>::new(move |kind: String, text: String| {
            f(&kind, text)
        });
        find_events(&cb);
        cb.forget();
    }
}

#[cfg(not(target_family = "wasm"))]
mod web {
    use super::Rect;
    pub fn place(_: Rect, _: [f32; 4], _: &str, _: usize, _: &str) {}
    pub fn focus() {}
    pub fn focused() -> bool {
        false
    }
    pub fn clear() {}
    pub fn hide() {}
    pub fn on_event(_: impl Fn(&str, String) + 'static) {}
}
