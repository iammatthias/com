//! Web components the canvas can't draw: an `<ff-*>` block in a post (a CONET station's
//! recording, and any component @com publishes the same way) is a real element laid over the canvas where the
//! block is painted, as the clips in dom_video are.
//!
//! The block reserves room in the column (the element's measured height once it has one) and a
//! probe reports where it's painted each render; the element is imported once from its module,
//! placed there (out of view too, hidden, so it's measured before the reader arrives), and
//! clipped to the visible column. It takes pointer input itself; wheel
//! scrolling over it is handed to the page. Elements not placed in the last render hide; leaving
//! the page removes them; an open corner panel hides them so they never cover it.
//!
//! To add a component: an entry in `EMBEDS`, and its module as assets/embeds/<component>.js,
//! defining the custom element of the same name. The post's own attributes are the element's.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;

use crate::overlay::{Extent, Gate, Layer, Rect};

/// A web component the site can host.
pub struct Embed {
    /// the `<ff-*>` name in a post, and the custom element its module defines
    pub component: &'static str,
    /// room kept for it until it reports its height
    pub height: f32,
}

pub const EMBEDS: &[Embed] = &[
    Embed {
        // a finished CONET station's recording, paged from its JSONL blob (com/public/embeds)
        component: "ff-tuner",
        height: 520.0,
    },
    Embed {
        // the analytics contract's finished record, read from its JSONL blob (com/public/embeds)
        component: "ff-onchain-analytics",
        height: 900.0,
    },
];

pub fn lookup(component: &str) -> Option<&'static Embed> {
    EMBEDS.iter().find(|e| e.component == component)
}

thread_local! {
    static PLACED: RefCell<Layer<()>> =
        RefCell::new(Layer::new(Gate::Page, Extent::BetweenControls));
    static HEIGHTS: RefCell<HashMap<String, f32>> = RefCell::new(HashMap::new());
    /// embeds keyed so far this render, so each gets its own key in page order
    static COUNT: Cell<usize> = const { Cell::new(0) };
    static RESIZED: crate::site::signal::Signal<()> = const { crate::site::signal::Signal::new() };
}

/// A signal whenever an element's height changes, so the page lays out again.
pub fn subscribe() -> futures::channel::mpsc::UnboundedReceiver<()> {
    let rx = RESIZED.with(|r| r.subscribe());
    web::on_height(|key, h| {
        let changed = HEIGHTS.with(|m| {
            m.borrow_mut()
                .insert(key.to_string(), h)
                .is_none_or(|old| (old - h).abs() > 0.5)
        });
        if changed {
            RESIZED.with(|r| r.send(()));
        }
    });
    rx
}

/// The element's measured height, css px.
pub fn height(key: &str) -> Option<f32> {
    HEIGHTS.with(|m| m.borrow().get(key).copied())
}

/// A content render of the payload for `path` begins: elements of other pages go, those the
/// last render didn't place hide.
pub fn begin_render(path: &str) {
    let (gone, dropped) = PLACED.with(|placed| {
        let mut placed = placed.borrow_mut();
        (placed.turn_to(path), placed.begin())
    });
    for (key, ()) in &gone {
        web::remove(key);
    }
    // keys begin with their page's path (`next_key`)
    let prefix = format!("{path}#");
    HEIGHTS.with(|m| m.borrow_mut().retain(|key, _| key.starts_with(&prefix)));
    COUNT.set(0);
    for key in &dropped {
        web::hide(key);
    }
}

/// The key for the next embed this render draws.
pub fn next_key(component: &str) -> String {
    let n = COUNT.get();
    COUNT.set(n + 1);
    PLACED.with(|placed| format!("{}#{component}-{n}", placed.borrow().page()))
}

/// Where the block for `key` is painted this render; `clip` is the visible part of the page.
/// `props` are the post's own attributes on the component, passed through.
/// `style` is the host's CSS: the page's tones, which the components read.
pub fn place(
    key: &str,
    embed: &Embed,
    props: &[(String, String)],
    style: &str,
    rect: Rect,
    clip: Rect,
) {
    let (inset, gated) = PLACED.with(|placed| {
        let mut placed = placed.borrow_mut();
        placed.place(key, || ());
        (placed.inset(rect, clip), placed.gated())
    });
    let attrs = serde_json::to_string(props).unwrap_or_else(|_| "[]".into());
    // placed (and so measured) even out of view, so the column has its real height before the
    // reader reaches it; shown only where it's visible
    let shown = inset.is_some() && !gated;
    let module = format!("embeds/{}.js", embed.component);
    web::place(
        key,
        embed.component,
        &module,
        &attrs,
        style,
        rect,
        inset.unwrap_or_default(),
        shown,
    );
}

/// Hide every element now (something has come in front of the page; overlay::blocked keeps them
/// hidden until it goes).
pub fn hide_all() {
    PLACED.with(|placed| {
        for key in placed.borrow().keys() {
            web::hide(key)
        }
    });
}

#[cfg(target_family = "wasm")]
mod web {
    use super::Rect;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen(module = "/js/dom.js")]
    extern "C" {
        #[wasm_bindgen(js_name = embedPlace)]
        fn embed_place(
            key: &str,
            tag: &str,
            module: &str,
            attrs: &str,
            style: &str,
            x: f32,
            y: f32,
            w: f32,
            t: f32,
            r: f32,
            b: f32,
            l: f32,
            shown: bool,
        );
        #[wasm_bindgen(js_name = embedHide)]
        fn embed_hide(key: &str);
        #[wasm_bindgen(js_name = embedRemove)]
        fn embed_remove(key: &str);
        #[wasm_bindgen(js_name = embedHeights)]
        fn embed_heights(cb: &Closure<dyn Fn(String, f64)>);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn place(
        key: &str,
        tag: &str,
        module: &str,
        attrs: &str,
        style: &str,
        rect: Rect,
        [t, r, b, l]: [f32; 4],
        shown: bool,
    ) {
        embed_place(
            key, tag, module, attrs, style, rect.x, rect.y, rect.w, t, r, b, l, shown,
        );
    }
    pub fn hide(key: &str) {
        embed_hide(key);
    }
    pub fn remove(key: &str) {
        embed_remove(key);
    }
    pub fn on_height(f: impl Fn(&str, f32) + 'static) {
        let cb = Closure::<dyn Fn(String, f64)>::new(move |k: String, h: f64| f(&k, h as f32));
        embed_heights(&cb);
        cb.forget();
    }
}

#[cfg(not(target_family = "wasm"))]
mod web {
    use super::Rect;
    #[allow(clippy::too_many_arguments)]
    pub fn place(_: &str, _: &str, _: &str, _: &str, _: &str, _: Rect, _: [f32; 4], _: bool) {}
    pub fn hide(_: &str) {}
    pub fn remove(_: &str) {}
    pub fn on_height(_: impl Fn(&str, f32) + 'static) {}
}
