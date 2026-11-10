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
    }

    /// Bring the head and the server-rendered page under the canvas up to date with `path`.
    pub fn sync_document(path: &str) {
        sync_document_js(path);
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
    pub fn push(_: &str) {}
    pub fn depth() -> u32 {
        0
    }
    pub fn back() {}
    pub fn replace(_: &str) {}
    pub fn set_title(_: &str) {}
    pub fn open_external(_: &str) {}
    pub fn on_popstate(_: impl Fn(String) + 'static) {}
    pub fn on_reconnect(_: impl Fn() + 'static) {}
    pub fn sync_document(_: &str) {}
}

pub use web::{
    back, current, depth, on_popstate, on_reconnect, open_external, origin, push, replace,
    set_title, sync_document,
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
