use gpui::prelude::*;
use gpui::{App, Bounds, WindowBounds, WindowOptions, px, size};

mod api;
mod browser;
mod color;
mod console;
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
mod select;
mod site;
mod theme;

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
    let app = gpui_platform::application().run(|cx: &mut App| {
        #[cfg(target_family = "wasm")]
        {
            let client = cx.http_client();
            let origin = route::origin();
            cx.spawn(async move |cx| {
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
                let mut faces = Vec::with_capacity(got.len());
                for (name, face) in fonts::FILES.iter().zip(got) {
                    match face {
                        Ok(bytes) => faces.push(Some(bytes)),
                        Err(e) if *name == fonts::OPTIONAL => {
                            console::warn(&format!("fonts: {e:#}; going without"));
                            faces.push(None);
                        }
                        Err(e) => {
                            crate::browser::plain_page();
                            console::warn(&format!("fonts: {e:#}"));
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
    std::mem::forget(app);
}

#[cfg(target_family = "wasm")]
thread_local! {
    static START: f64 = js_sys::Date::now();
    static PERF: bool = crate::browser::debug::flag("perf");
}

const BUILD: &str = "2026-10-14.2";

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
    select::init(cx);
    if let Err(e) = cx.text_system().add_fonts(fonts::all()) {
        crate::browser::plain_page();
        console::warn(&format!("font load failed: {e:#}"));
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
    if let Err(e) = opened {
        crate::browser::plain_page();
        console::warn(&format!("failed to open window: {e:#}"));
        return;
    }
    mark("window open");
    cx.activate(true);
}

#[cfg(test)]
mod build_guards {
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
