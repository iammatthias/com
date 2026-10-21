use gpui::prelude::*;
use gpui::{App, Bounds, WindowBounds, WindowOptions, px, size};

mod api;
mod content;
mod design;
mod dom_embed;
mod dom_input;
mod dom_video;
mod drawers;
mod fonts;
mod home;
mod http;
mod intro;
mod limits;
mod overlay;
mod page;
mod plate;
mod prefs;
mod route;
mod search;
mod seed;
mod site;
mod theme;

/// Linear memory in bytes, for watching growth from the page (`wasmBindings.wasm_memory_bytes()`).
#[cfg(target_family = "wasm")]
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn wasm_memory_bytes() -> f64 {
    use wasm_bindgen::JsCast as _;
    wasm_bindgen::memory()
        .unchecked_into::<js_sys::WebAssembly::Memory>()
        .buffer()
        .unchecked_into::<js_sys::ArrayBuffer>()
        .byte_length() as f64
}

fn main() {
    #[cfg(target_family = "wasm")]
    gpui_platform::web_init();
    mark(&format!("wasm main (t=0), build {BUILD}"));
    gpui_platform::application().run(|cx: &mut App| {
        // the faces first (fetched beside the app on the web), then the window
        #[cfg(target_family = "wasm")]
        {
            let client = cx.http_client();
            let origin = route::origin();
            cx.spawn(async move |cx| {
                // one dropped request shouldn't cost the site its faces
                let gets = fonts::FILES.iter().map(|name| {
                    let url = format!("{origin}{}/{name}", fonts::DIR);
                    http::get_bytes(
                        client.clone(),
                        url,
                        http::Retry::BRIEF,
                        cx.background_executor().clone(),
                    )
                });
                let got = futures::future::join_all(gets).await;
                // without a required face the app can't letter anything: the plain page instead
                let mut faces = Vec::with_capacity(got.len());
                for (name, face) in fonts::FILES.iter().zip(got) {
                    match face {
                        Ok(bytes) => faces.push(Some(bytes)),
                        Err(e) if *name == fonts::OPTIONAL => {
                            // a warning, not an error: the page's error overlay is for failures
                            web_sys::console::warn_1(
                                &format!("fonts: {e:#}; going without").into(),
                            );
                            faces.push(None);
                        }
                        Err(e) => {
                            route::plain_page();
                            eprintln!("fonts: {e:#}");
                            return;
                        }
                    }
                }
                fonts::set(faces);
                let _ = cx.update(start);
            })
            .detach();
        }
        #[cfg(not(target_family = "wasm"))]
        start(cx);
    });
}

#[cfg(target_family = "wasm")]
thread_local! {
    static START: f64 = js_sys::Date::now();
    static PERF: bool = route::debug::flag("perf");
}

/// Which build this is (in the #perf log). Its bytes are part of the wasm, so bumping it gives the
/// build new hashed file names: the way out if an edge ever keeps a bad copy of one.
const BUILD: &str = "2026-10-14.2";

/// A startup timing, in ms since the app began, logged to the console with `#perf` in the URL.
pub fn mark(what: &str) {
    #[cfg(target_family = "wasm")]
    if PERF.with(|p| *p) {
        let t = js_sys::Date::now() - START.with(|s| *s);
        web_sys::console::log_1(&format!("PERF {t:.0} {what}").into());
    }
    let _ = what;
}

fn start(cx: &mut App) {
    mark("fonts fetched");
    if let Err(e) = cx.text_system().add_fonts(fonts::all()) {
        route::plain_page();
        eprintln!("font load failed: {e:#}");
        return;
    }
    cx.set_global(theme::Choice::from_key(
        &prefs::get("theme").unwrap_or_default(),
    ));
    let bounds = Bounds::centered(None, size(px(1024.), px(768.)), cx);
    let opened = cx.open_window(
        WindowOptions::new().window_bounds(Some(WindowBounds::Windowed(bounds))),
        |window, cx| cx.new(|cx| site::Site::new(window, cx)),
    );
    // no surface to draw on (an adapter that went away, a device refused): the plain page
    if let Err(e) = opened {
        route::plain_page();
        eprintln!("failed to open window: {e:#}");
        return;
    }
    mark("window open");
    cx.activate(true);
}

#[cfg(test)]
mod build_guards {
    /// shims/wgpu keeps WebGL (wgpu-core, wgpu-hal: ~1.1MB) out of the web build. If gpui-ce moves
    /// to a wgpu the stand-in no longer matches, Cargo stops using it and WebGL comes back
    /// silently; this says so.
    #[test]
    fn web_build_has_no_webgl() {
        let out = std::process::Command::new(env!("CARGO"))
            .args([
                "tree",
                "--target",
                "wasm32-unknown-unknown",
                "-e",
                "normal",
                "-i",
                "wgpu-core",
            ])
            .current_dir(env!("CARGO_MANIFEST_DIR"))
            .output()
            .expect("cargo tree");
        let tree = String::from_utf8_lossy(&out.stdout);
        assert!(
            tree.trim().is_empty(),
            "the web build links wgpu-core again: update shims/wgpu to gpui-ce's wgpu\n{tree}"
        );
    }

    /// shims/usvg and shims/resvg keep gpui's SVG renderer out of the web build (the browser draws
    /// the site's SVG); the real parser's XML reader showing up means they stopped applying.
    #[test]
    fn web_build_has_no_svg_renderer() {
        let out = std::process::Command::new(env!("CARGO"))
            .args([
                "tree",
                "--target",
                "wasm32-unknown-unknown",
                "-e",
                "normal",
                "-i",
                "roxmltree",
            ])
            .current_dir(env!("CARGO_MANIFEST_DIR"))
            .output()
            .expect("cargo tree");
        let tree = String::from_utf8_lossy(&out.stdout);
        assert!(
            tree.trim().is_empty(),
            "the web build links usvg's parser again: update shims/usvg and shims/resvg\n{tree}"
        );
    }
}
