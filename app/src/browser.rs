pub mod debug {
    pub fn flag(name: &str) -> bool {
        flag_in(&super::web::hash(), name)
    }

    pub fn number(name: &str) -> Option<f32> {
        number_in(&super::web::hash(), name)
    }

    pub fn slow_ui() -> bool {
        thread_local! {
            static SLOW: std::cell::Cell<Option<bool>> = const { std::cell::Cell::new(None) };
            static WATCHING: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
        }
        if let Some(on) = SLOW.get() {
            return on;
        }
        let on = flag("slowui");
        if !WATCHING.replace(true) {
            super::on_hashchange(|| SLOW.set(None));
        }
        SLOW.set(Some(on));
        on
    }

    pub fn slow() -> f32 {
        thread_local! {
            static SLOW: f32 = number("slow").map_or(1.0, |f| f.max(0.05));
        }
        SLOW.with(|s| *s)
    }

    fn flag_in(hash: &str, name: &str) -> bool {
        hash.trim_start_matches('#').split('&').any(|p| p == name)
    }

    fn number_in(hash: &str, name: &str) -> Option<f32> {
        hash.trim_start_matches('#').split('&').find_map(|p| {
            p.strip_prefix(name)
                .and_then(|v| v.strip_prefix('='))
                .and_then(|v| v.parse().ok())
        })
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn reads_hash_switches() {
            assert!(flag_in("#perf&lite", "lite"));
            assert!(!flag_in("#perf&lite", "lit"));
            assert!(!flag_in("", "perf"));
            assert_eq!(number_in("#z=6&px=-400&py=200", "px"), Some(-400.0));
            assert_eq!(number_in("#z=6&slow=x", "slow"), None);
            assert_eq!(number_in("#zz=6", "z"), None);
            assert_eq!(number_in("#t=5.2", "t"), Some(5.2));
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
#[cfg_attr(not(target_family = "wasm"), allow(dead_code))]
pub enum Gesture {
    Touch { fingers: u32 },
    Pan { dx: f32, dy: f32 },
    Pinch { factor: f32, x: f32, y: f32 },
}

#[cfg(target_family = "wasm")]
mod web {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::prelude::wasm_bindgen;

    #[wasm_bindgen(module = "/js/dom.js")]
    extern "C" {
        #[wasm_bindgen(js_name = registerWebMcp)]
        fn register_web_mcp_js();
        #[wasm_bindgen(js_name = safeInsets)]
        fn safe_insets_js() -> Vec<f32>;
        #[wasm_bindgen(js_name = installTouchGestures)]
        fn install_touch_gestures_js(
            cb: &wasm_bindgen::closure::Closure<dyn Fn(String, f64, f64, f64)>,
        );
    }

    pub fn on_touch_gesture(f: impl Fn(super::Gesture) + 'static) {
        use super::Gesture;
        let cb = wasm_bindgen::closure::Closure::<dyn Fn(String, f64, f64, f64)>::new(
            move |k: String, a: f64, b: f64, c: f64| {
                let (a, b, c) = (a as f32, b as f32, c as f32);
                match k.as_str() {
                    "touch" => f(Gesture::Touch { fingers: a as u32 }),
                    "pan" => f(Gesture::Pan { dx: a, dy: b }),
                    "pinch" => f(Gesture::Pinch {
                        factor: a,
                        x: b,
                        y: c,
                    }),
                    _ => {}
                }
            },
        );
        install_touch_gestures_js(&cb);
        cb.forget();
    }

    pub fn safe_insets() -> [f32; 4] {
        if let Some(insets) = INSETS.get() {
            return insets;
        }
        watch_viewport();
        let v = safe_insets_js();
        let insets = [
            v.first().copied().unwrap_or(0.),
            v.get(1).copied().unwrap_or(0.),
            v.get(2).copied().unwrap_or(0.),
            v.get(3).copied().unwrap_or(0.),
        ];
        INSETS.set(Some(insets));
        insets
    }

    thread_local! {
        static INSETS: std::cell::Cell<Option<[f32; 4]>> = const { std::cell::Cell::new(None) };
        static WATCHING: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    }

    fn watch_viewport() {
        use wasm_bindgen::JsCast as _;
        use wasm_bindgen::closure::Closure;
        if WATCHING.replace(true) {
            return;
        }
        let Some(window) = web_sys::window() else {
            return;
        };
        let cb = Closure::<dyn Fn()>::new(|| INSETS.set(None));
        let f = cb.as_ref().unchecked_ref();
        let _ = window.add_event_listener_with_callback("resize", f);
        let _ = window.add_event_listener_with_callback("orientationchange", f);
        if let Some(vv) = js_sys::Reflect::get(&window, &"visualViewport".into())
            .ok()
            .and_then(|v| v.dyn_into::<web_sys::EventTarget>().ok())
        {
            let _ = vv.add_event_listener_with_callback("resize", f);
        }
        cb.forget();
    }

    pub fn register_web_mcp() {
        register_web_mcp_js();
    }

    pub fn hash() -> String {
        web_sys::window()
            .and_then(|w| w.location().hash().ok())
            .unwrap_or_default()
    }

    pub fn reduced_motion() -> bool {
        web_sys::window()
            .and_then(|w| {
                w.match_media("(prefers-reduced-motion: reduce)")
                    .ok()
                    .flatten()
            })
            .is_some_and(|m| m.matches())
    }

    pub fn on_hashchange(f: impl Fn() + 'static) {
        use wasm_bindgen::JsCast as _;
        use wasm_bindgen::closure::Closure;
        let Some(window) = web_sys::window() else {
            return;
        };
        let cb = Closure::<dyn Fn()>::new(f);
        let _ = window.add_event_listener_with_callback("hashchange", cb.as_ref().unchecked_ref());
        cb.forget();
    }

    pub fn plain_page() {
        let Some(w) = web_sys::window() else { return };
        let _ = js_sys::Reflect::set(&w, &"__noGpu".into(), &JsValue::TRUE);
        if let Some(html) = w.document().and_then(|d| d.document_element()) {
            let mut classes: Vec<String> = html
                .class_name()
                .split_whitespace()
                .filter(|c| *c != "js" && *c != "no-gpu")
                .map(String::from)
                .collect();
            classes.push("no-gpu".into());
            html.set_class_name(&classes.join(" "));
        }
    }
}

#[cfg(not(target_family = "wasm"))]
mod web {
    pub fn hash() -> String {
        String::new()
    }
    pub fn reduced_motion() -> bool {
        false
    }
    pub fn on_hashchange(_: impl Fn() + 'static) {}
    pub fn plain_page() {}
    pub fn register_web_mcp() {}
    pub fn on_touch_gesture(_: impl Fn(super::Gesture) + 'static) {}
    pub fn safe_insets() -> [f32; 4] {
        [0.; 4]
    }
}

pub use web::{
    on_hashchange, on_touch_gesture, plain_page, reduced_motion, register_web_mcp, safe_insets,
};
