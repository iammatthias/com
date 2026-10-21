//! URL ⇄ route, and the browser history the canvas otherwise knows nothing about.

/// The route families the site serves. Anything the app does not recognise is still
/// handed to the Worker, which knows every redirect and fallback.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Route {
    Home,
    Other(String),
}

impl Route {
    pub fn parse(path: &str) -> Self {
        let path = path.split(['?', '#']).next().unwrap_or("/");
        match path.trim_end_matches('/') {
            "" => Route::Home,
            p => Route::Other(p.to_string()),
        }
    }

    pub fn path(&self) -> &str {
        match self {
            Route::Home => "/",
            Route::Other(p) => p,
        }
    }
}

thread_local! {
    static NARROW: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
}

/// A phone-width window (the reading column spans it), set each frame by the site.
pub fn narrow() -> bool {
    NARROW.get()
}

pub fn set_narrow(on: bool) {
    NARROW.set(on);
}

/// Paths the site owns and opens in place; everything else leaves in a new tab.
pub fn is_internal(href: &str) -> bool {
    // a backslash reads as a slash in a URL, so "/\\host" is protocol-relative too
    let relative = href.starts_with('/') && !href.starts_with("//") && !href.contains('\\');
    let ours = relative || site_path(href).is_some();
    ours && !is_document(&to_path(href))
}

/// What a new tab may be opened on: a web page or a mail address, or a link with no scheme at
/// all (a document of ours, a protocol-relative one). Control characters never qualify, and
/// the ends are trimmed first: a browser strips both, which would turn ` java\tscript:` back
/// into a script.
pub fn is_openable(href: &str) -> bool {
    if href.chars().any(char::is_control) {
        return false;
    }
    let href = href.trim();
    let Some(colon) = href.find(':') else {
        return true;
    };
    let scheme = &href[..colon];
    let has_scheme = scheme.starts_with(|c: char| c.is_ascii_alphabetic())
        && scheme
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "+.-".contains(c));
    !has_scheme || ["http", "https", "mailto"].contains(&scheme.to_ascii_lowercase().as_str())
}

/// The path of an absolute URL on this site (this origin or iammatthias.com), if it is one.
/// The host must end where the path begins: `iammatthias.com.example` is someone else.
fn site_path(href: &str) -> Option<String> {
    let origin = origin();
    for prefix in [
        origin.as_str(),
        "https://iammatthias.com",
        "https://www.iammatthias.com",
    ] {
        if prefix.is_empty() {
            continue;
        }
        if let Some(rest) = href.strip_prefix(prefix) {
            if rest.is_empty() {
                return Some("/".into());
            }
            if rest.starts_with(['/', '?', '#']) {
                return Some(if rest.starts_with('/') {
                    rest.to_string()
                } else {
                    format!("/{rest}")
                });
            }
        }
    }
    None
}

/// A file the Worker serves beside the pages (markdown twins, feeds, llms.txt, the agent
/// surface, images): the browser opens it, the app doesn't route to it.
pub fn is_document(path: &str) -> bool {
    let path = path.split(['?', '#']).next().unwrap_or(path);
    const FILES: [&str; 9] = [
        ".md", ".xml", ".txt", ".json", ".svg", ".png", ".jpg", ".webp", ".graphql",
    ];
    const ROOTS: [&str; 6] = [
        "/.well-known/",
        "/api/",
        "/img/",
        "/mcp",
        "/graphql",
        "/schema.graphql",
    ];
    FILES.iter().any(|ext| path.ends_with(ext)) || ROOTS.iter().any(|root| path.starts_with(root))
}

/// An internal href as a site path: `https://iammatthias.com/posts/x` → `/posts/x`.
pub fn to_path(href: &str) -> String {
    site_path(href).unwrap_or_else(|| href.to_string())
}

/// The debug switches in the address (ARCHITECTURE.md, "Debug flags").
pub mod debug {
    /// `#name` among the hash's `&`-joined flags.
    pub fn flag(name: &str) -> bool {
        flag_in(&super::web::hash(), name)
    }

    /// A `#name=value` number in the hash (`#z=6&px=-400&py=200` starts the plate there).
    pub fn number(name: &str) -> Option<f32> {
        number_in(&super::web::hash(), name)
    }

    /// `#slowui`: the panels move at a tenth of their speed. Read every frame, so it's kept until
    /// the hash changes.
    pub fn slow_ui() -> bool {
        thread_local! {
            static SLOW: std::cell::Cell<Option<bool>> = const { std::cell::Cell::new(None) };
            static WATCHING: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
        }
        if let Some(on) = SLOW.get() {
            return on;
        }
        let on = flag("slowui");
        // the first read listens for changes from then on
        if !WATCHING.replace(true) {
            super::on_hashchange(|| SLOW.set(None));
        }
        SLOW.set(Some(on));
        on
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

/// A touch gesture on the page (CSS px).
#[derive(Clone, Copy, Debug, PartialEq)]
#[cfg_attr(not(target_family = "wasm"), allow(dead_code))]
pub enum Gesture {
    /// how many fingers are down now
    Touch { fingers: u32 },
    /// the fingers' midpoint moved by this much
    Pan { dx: f32, dy: f32 },
    /// the fingers spread by this factor about (x, y)
    Pinch { factor: f32, x: f32, y: f32 },
}

#[cfg(target_family = "wasm")]
mod web {
    use wasm_bindgen::JsValue;
    use wasm_bindgen::prelude::wasm_bindgen;

    #[wasm_bindgen(module = "/js/dom.js")]
    extern "C" {
        #[wasm_bindgen(js_name = syncDocument)]
        fn sync_document_js(path: &str);
        #[wasm_bindgen(js_name = onReconnect)]
        fn on_reconnect_js(f: &js_sys::Function);
        #[wasm_bindgen(js_name = registerWebMcp)]
        fn register_web_mcp_js();
        #[wasm_bindgen(js_name = safeInsets)]
        fn safe_insets_js() -> Vec<f32>;
        #[wasm_bindgen(js_name = installTouchGestures)]
        fn install_touch_gestures_js(
            cb: &wasm_bindgen::closure::Closure<dyn Fn(String, f64, f64, f64)>,
        );
    }

    /// Touch gestures on the page. dom.js sends ("touch", fingers) · ("pan", dx, dy) ·
    /// ("pinch", factor, x, y); anything else is dropped here.
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

    /// What the system keeps of the screen (notch, status bar, home indicator): top, right,
    /// bottom, left in css px. The canvas draws under it; controls stay clear of it.
    /// Read a dozen times a frame: kept here until the viewport changes (as dom.js keeps its own).
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

    /// Forget the insets whenever what's free of the system's chrome may have changed.
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
        // the toolbars collapsing and returning, without a window resize
        if let Some(vv) = js_sys::Reflect::get(&window, &"visualViewport".into())
            .ok()
            .and_then(|v| v.dyn_into::<web_sys::EventTarget>().ok())
        {
            let _ = vv.add_event_listener_with_callback("resize", f);
        }
        cb.forget();
    }

    /// Bring the head and the server-rendered page under the canvas up to date with `path`.
    pub fn sync_document(path: &str) {
        sync_document_js(path);
    }

    /// Offer agents the site's WebMCP tools.
    pub fn register_web_mcp() {
        register_web_mcp_js();
    }

    pub fn hash() -> String {
        web_sys::window()
            .and_then(|w| w.location().hash().ok())
            .unwrap_or_default()
    }

    /// The visitor asked their system for less motion.
    pub fn reduced_motion() -> bool {
        web_sys::window()
            .and_then(|w| {
                w.match_media("(prefers-reduced-motion: reduce)")
                    .ok()
                    .flatten()
            })
            .is_some_and(|m| m.matches())
    }

    /// Calls `f` whenever the address's hash changes.
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

    pub fn origin() -> String {
        web_sys::window()
            .and_then(|w| w.location().origin().ok())
            .unwrap_or_default()
    }

    pub fn current() -> String {
        let Some(loc) = web_sys::window().map(|w| w.location()) else {
            return "/".into();
        };
        loc.pathname().unwrap_or_else(|_| "/".into())
    }

    /// How many of the site's own views lie behind this one (kept in the history entry's
    /// state): 0 when the visitor arrived here from elsewhere.
    pub fn depth() -> u32 {
        web_sys::window()
            .and_then(|w| w.history().ok())
            .and_then(|h| h.state().ok())
            .and_then(|s| s.as_f64())
            .map(|d| d as u32)
            .unwrap_or(0)
    }

    pub fn push(path: &str) {
        let next = depth() + 1;
        if let Some(history) = web_sys::window().and_then(|w| w.history().ok()) {
            let _ = history.push_state_with_url(&JsValue::from_f64(next as f64), "", Some(path));
        }
    }

    pub fn replace(path: &str) {
        let here = depth();
        if let Some(history) = web_sys::window().and_then(|w| w.history().ok()) {
            let _ = history.replace_state_with_url(&JsValue::from_f64(here as f64), "", Some(path));
        }
    }

    /// The browser's back, within the site.
    pub fn back() {
        if let Some(history) = web_sys::window().and_then(|w| w.history().ok()) {
            let _ = history.back();
        }
    }

    pub fn set_title(title: &str) {
        if let Some(doc) = web_sys::window().and_then(|w| w.document()) {
            doc.set_title(title);
        }
    }

    /// The app can't start (a face or the window failed): leave the server-rendered page in
    /// view, as index.html does when there's no WebGPU, and keep its failure notes quiet.
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

    pub fn open_external(href: &str) {
        if !super::is_openable(href) {
            return;
        }
        if let Some(w) = web_sys::window() {
            // noopener: the new tab gets no handle on this one
            let _ = w.open_with_url_and_target_and_features(href, "_blank", "noopener,noreferrer");
        }
    }

    /// Calls `f` with the new path whenever the browser's back/forward moves us.
    pub fn on_popstate(f: impl Fn(String) + 'static) {
        use wasm_bindgen::JsCast as _;
        use wasm_bindgen::closure::Closure;
        let Some(window) = web_sys::window() else {
            return;
        };
        let cb = Closure::<dyn Fn()>::new(move || f(current()));
        let _ = window.add_event_listener_with_callback("popstate", cb.as_ref().unchecked_ref());
        cb.forget();
    }

    /// `f` when the network may be back (dom.js's onReconnect, which the embeds use too).
    pub fn on_reconnect(f: impl Fn() + 'static) {
        use wasm_bindgen::JsCast as _;
        use wasm_bindgen::closure::Closure;
        let cb = Closure::<dyn Fn()>::new(f);
        on_reconnect_js(cb.as_ref().unchecked_ref());
        cb.forget();
    }
}

#[cfg(not(target_family = "wasm"))]
mod web {
    pub fn origin() -> String {
        "https://iammatthias.com".into()
    }
    pub fn current() -> String {
        "/".into()
    }
    pub fn hash() -> String {
        String::new()
    }
    pub fn reduced_motion() -> bool {
        false
    }
    pub fn on_hashchange(_: impl Fn() + 'static) {}
    pub fn push(_: &str) {}
    pub fn depth() -> u32 {
        0
    }
    pub fn back() {}
    pub fn replace(_: &str) {}
    pub fn set_title(_: &str) {}
    pub fn open_external(_: &str) {}
    pub fn plain_page() {}
    pub fn on_popstate(_: impl Fn(String) + 'static) {}
    pub fn on_reconnect(_: impl Fn() + 'static) {}
    pub fn sync_document(_: &str) {}
    pub fn register_web_mcp() {}
    pub fn on_touch_gesture(_: impl Fn(super::Gesture) + 'static) {}
    pub fn safe_insets() -> [f32; 4] {
        [0.; 4]
    }
}

pub use web::{
    back, current, depth, on_hashchange, on_popstate, on_reconnect, on_touch_gesture,
    open_external, origin, plain_page, push, reduced_motion, register_web_mcp, replace,
    safe_insets, set_title, sync_document,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_paths() {
        assert_eq!(Route::parse("/"), Route::Home);
        assert_eq!(Route::parse(""), Route::Home);
        assert_eq!(
            Route::parse("/posts/abc/"),
            Route::Other("/posts/abc".into())
        );
        assert_eq!(Route::parse("/feed?x=1#y"), Route::Other("/feed".into()));
    }

    #[test]
    fn internal_links() {
        assert!(is_internal("/posts/x"));
        assert!(is_internal("https://iammatthias.com/art"));
        assert!(!is_internal("//cdn.example.com/x"));
        // a browser reads "\\" as "/": this one is another host
        assert!(!is_internal("/\\evil.example"));
        assert!(!is_internal("https://example.com"));
        assert!(!is_internal("/rss.xml"));
        assert!(!is_internal("/posts/x.md"));
        assert!(!is_internal("https://iammatthias.com/llms-full.txt"));
        assert!(!is_internal("/.well-known/api-catalog"));
        assert!(is_internal("/feed"));
        assert!(!is_internal("https://iammatthias.com.example/x"));
        assert_eq!(to_path("https://iammatthias.com?q=1"), "/?q=1");
        assert_eq!(to_path("https://iammatthias.com/posts/x"), "/posts/x");
        assert_eq!(to_path("https://iammatthias.com"), "/");
    }

    #[test]
    fn openable_links() {
        assert!(is_openable("https://example.com/x"));
        assert!(is_openable("HTTP://example.com"));
        assert!(is_openable("mailto:hi@example.com"));
        assert!(is_openable("/rss.xml"));
        assert!(is_openable("//cdn.example.com/x"));
        assert!(is_openable("/posts/a:b"));
        assert!(!is_openable("javascript:alert(1)"));
        assert!(!is_openable("JAVASCRIPT:alert(1)"));
        assert!(!is_openable(" javascript:alert(1)"));
        assert!(!is_openable("java\tscript:alert(1)"));
        assert!(!is_openable("data:text/html,hi"));
        assert!(!is_openable("vbscript:x"));
        assert!(!is_openable("file:///etc/passwd"));
    }
}
