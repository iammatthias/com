//! Mermaid-syntax diagrams, drawn by pele in the browser (themed to the paper, set in Inter),
//! rasterized there, and shown on the canvas as an image. Each source is asked for once per
//! theme and width; the page redraws when its pixels arrive.

use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::Arc;

use gpui::{RenderImage, Rgba};

use crate::theme::Theme;

#[derive(Clone)]
pub enum Diagram {
    Pending,
    Ready {
        image: Arc<RenderImage>,
        width: f32,
        height: f32,
    },
    /// drawn as its source instead
    Failed,
}

/// most diagrams kept drawn (each a full raster)
const KEEP: usize = 24;

thread_local! {
    static DIAGRAMS: RefCell<HashMap<u64, Diagram>> = RefCell::new(HashMap::new());
    /// the order they were asked for, oldest first, to let the oldest go
    static ORDER: RefCell<std::collections::VecDeque<u64>> = RefCell::new(Default::default());
    /// images let go, for the page to free from the GPU on its next render
    static EVICTED: RefCell<Vec<Arc<RenderImage>>> = RefCell::new(Vec::new());
    /// the font has crossed to the browser (it is only read on the first diagram)
    static FONT_SENT: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    /// failed because their code didn't load, not their source
    static LOAD_FAILED: RefCell<std::collections::HashSet<u64>> = RefCell::new(Default::default());
    /// retry_failed_loads listens for the network coming back
    static RECONNECT_HEARD: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    static READY: crate::site::signal::Signal<()> = const { crate::site::signal::Signal::new() };
}

/// A signal for every diagram that finishes, so the page can redraw.
pub fn subscribe() -> futures::channel::mpsc::UnboundedReceiver<()> {
    READY.with(|r| r.subscribe())
}

fn key(source: &str, dark: bool, width: f32, dpr: f32) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut h = std::collections::hash_map::DefaultHasher::new();
    source.hash(&mut h);
    dark.hash(&mut h);
    (width.round() as u32).hash(&mut h);
    ((dpr * 4.0).round() as u32).hash(&mut h);
    h.finish()
}

/// Images let go since the last call, to hand to `drop_image`.
pub fn take_evicted() -> Vec<Arc<RenderImage>> {
    EVICTED.with(|e| std::mem::take(&mut *e.borrow_mut()))
}

fn hex(c: Rgba) -> String {
    let b = |v: f32| (v.clamp(0.0, 1.0) * 255.0).round() as u8;
    format!(
        "#{:02x}{:02x}{:02x}",
        b(c.color.red),
        b(c.color.green),
        b(c.color.blue)
    )
}

/// What's known for `k`, or None after marking it on its way (the caller then asks for it).
fn begin(k: u64) -> Option<Diagram> {
    if let Some(d) = DIAGRAMS.with(|m| m.borrow().get(&k).cloned()) {
        return Some(d);
    }
    DIAGRAMS.with(|m| m.borrow_mut().insert(k, Diagram::Pending));
    ORDER.with(|o| {
        let mut o = o.borrow_mut();
        o.push_back(k);
        while o.len() > KEEP {
            let Some(old) = o.pop_front() else { break };
            if let Some(Diagram::Ready { image, .. }) =
                DIAGRAMS.with(|m| m.borrow_mut().remove(&old))
            {
                EVICTED.with(|e| e.borrow_mut().push(image));
            }
        }
    });
    None
}

/// The diagram for `source` at `width` css px: drawn, on its way (asked for now if new), or failed.
pub fn get(source: &str, theme: &Theme, width: f32, dpr: f32) -> Diagram {
    let dpr = dpr.clamp(1.0, 2.0);
    let k = key(source, theme.dark, width, dpr);
    if let Some(d) = begin(k) {
        return d;
    }
    let palette = serde_json::json!({
        "paper": hex(theme.paper),
        "ink": hex(theme.ink),
        "muted": hex(theme.muted),
        "rule": hex(theme.rule),
        "accent": hex(theme.accent),
        "stops": theme.stops.map(hex),
    })
    .to_string();
    web::render(k, source, &palette, width, dpr);
    Diagram::Pending
}

fn finish(k: u64, d: Diagram) {
    // a diagram let go while it was drawing stays let go
    if DIAGRAMS.with(|m| !m.borrow().contains_key(&k)) {
        return;
    }
    DIAGRAMS.with(|m| m.borrow_mut().insert(k, d));
    READY.with(|r| r.send(()));
}

#[cfg(target_family = "wasm")]
mod web {
    use super::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::prelude::wasm_bindgen;

    /// How dom.js's renderDiagram starts the error of a module that didn't load (its `code`).
    const LOAD_ERROR: &str = "load:";

    /// `k`'s code didn't load: asked for again once the network may be back.
    fn load_failed(k: u64) {
        LOAD_FAILED.with(|f| f.borrow_mut().insert(k));
        if !RECONNECT_HEARD.replace(true) {
            crate::route::on_reconnect(retry_failed_loads);
        }
    }

    /// Forget every diagram whose code didn't load, so the page's next render asks for it again.
    fn retry_failed_loads() {
        let failed = LOAD_FAILED.with(|f| std::mem::take(&mut *f.borrow_mut()));
        if failed.is_empty() {
            return;
        }
        DIAGRAMS.with(|m| m.borrow_mut().retain(|k, _| !failed.contains(k)));
        ORDER.with(|o| o.borrow_mut().retain(|k| !failed.contains(k)));
        READY.with(|r| r.send(()));
    }

    #[wasm_bindgen(module = "/js/dom.js")]
    extern "C" {
        #[wasm_bindgen(js_name = renderDiagram)]
        fn render_diagram(
            key: &str,
            source: &str,
            theme: &str,
            max_width: f64,
            dpr: f64,
            font: &[u8],
            done: &js_sys::Function,
        );
    }

    /// The callback the browser hands the pixels (or an error) back through.
    fn received() -> wasm_bindgen::JsValue {
        Closure::once_into_js(
            move |key: String,
                  w: u32,
                  h: u32,
                  css_w: f64,
                  css_h: f64,
                  rgba: js_sys::Uint8Array,
                  error: String| {
                let Ok(k) = key.parse::<u64>() else { return };
                if !error.is_empty() || w == 0 || h == 0 {
                    // the page shows the source instead; why is for the console
                    web_sys::console::warn_1(&format!("diagram: {error}").into());
                    // its code didn't arrive (not its source at fault): the source meanwhile, and
                    // another try once the network is back
                    if error.starts_with(LOAD_ERROR) {
                        load_failed(k);
                    }
                    finish(k, Diagram::Failed);
                    return;
                }
                let mut px = rgba.to_vec();
                for p in px.chunks_exact_mut(4) {
                    p.swap(0, 2); // RGBA → the BGRA gpui draws
                }
                let Some(buffer) = image::RgbaImage::from_raw(w, h, px) else {
                    web_sys::console::warn_1(&"diagram: bad pixel buffer".into());
                    finish(k, Diagram::Failed);
                    return;
                };
                let image = Arc::new(RenderImage::new(vec![image::Frame::new(buffer)]));
                finish(
                    k,
                    Diagram::Ready {
                        image,
                        width: css_w as f32,
                        height: css_h as f32,
                    },
                );
            },
        )
    }

    pub fn render(k: u64, source: &str, palette: &str, width: f32, dpr: f32) {
        use wasm_bindgen::JsCast as _;
        let done = received();
        // Inter for the diagrams' text, sent once: the browser keeps it after the first
        let font: &[u8] = if FONT_SENT.replace(true) {
            &[]
        } else {
            crate::fonts::sans()
        };
        render_diagram(
            &k.to_string(),
            source,
            palette,
            width as f64,
            dpr as f64,
            font,
            done.unchecked_ref(),
        );
    }
}

#[cfg(not(target_family = "wasm"))]
mod web {
    pub fn render(_: u64, _: &str, _: &str, _: f32, _: f32) {}
}
