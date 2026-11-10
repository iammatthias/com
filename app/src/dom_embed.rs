use std::cell::{Cell, RefCell};
use std::collections::HashMap;

use crate::overlay::{Extent, Gate, Layer, Rect, Stage};

pub struct Embed {
    pub component: &'static str,
    pub height: f32,
}

pub const EMBEDS: &[Embed] = &[
    Embed {
        component: "ff-tuner",
        height: 520.0,
    },
    Embed {
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
    static COUNT: Cell<usize> = const { Cell::new(0) };
    static RESIZED: crate::site::signal::Signal<()> = const { crate::site::signal::Signal::new() };
}

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

pub fn height(key: &str) -> Option<f32> {
    HEIGHTS.with(|m| m.borrow().get(key).copied())
}

pub fn begin_render(path: &str, stage: Stage) {
    let (gone, dropped) = PLACED.with(|placed| {
        let mut placed = placed.borrow_mut();
        placed.set_stage(stage);
        (placed.turn_to(path), placed.begin())
    });
    for (key, ()) in &gone {
        web::remove(key);
    }
    let prefix = format!("{path}#");
    HEIGHTS.with(|m| m.borrow_mut().retain(|key, _| key.starts_with(&prefix)));
    COUNT.set(0);
    for key in &dropped {
        web::hide(key);
    }
}

pub fn next_key(component: &str) -> String {
    let n = COUNT.get();
    COUNT.set(n + 1);
    PLACED.with(|placed| format!("{}#{component}-{n}", placed.borrow().page()))
}

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
