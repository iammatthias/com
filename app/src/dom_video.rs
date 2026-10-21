//! Video the canvas can't draw: a real `<video>` laid over the canvas where a figure is painted.
//!
//! GPUI has no video decoder on the web, so a figure that holds a clip reports its painted
//! bounds here (from a canvas probe in its prepaint) and this module keeps one muted, looping,
//! inline `<video>` per clip in `document.body`, `position: absolute` (the page never scrolls; iOS won't paint fixed content under its toolbars) above the canvas with
//! `pointer-events: none` (so hover and clicks still reach GPUI), clipped to the scroll
//! viewport. A requestAnimationFrame loop applies placement and play state, and runs only
//! while any clip is registered.
//!
//! Clips belong to the render that placed them. The page is a cached view: it only renders
//! (and so only re-places its clips) when something changes. Each content render starts a new
//! epoch; a clip not placed in the latest epoch is hidden, and a clip placed on another route
//! is removed outright, which also covers going home (where content stops rendering).
//!
//! `prefers-reduced-motion` turns autoplay off: the figure shows its poster and a "play"
//! that starts the clip. Live tiles (a still with motion behind it) play on hover where
//! there is hover, and while well in view (at most two) where there isn't.

use std::cell::RefCell;
use std::collections::HashMap;

use crate::overlay::Rect;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Mode {
    /// the clip is the figure: plays by itself (unless motion is reduced)
    Auto,
    /// a still with motion behind it: plays while hovered (or in view on touch)
    Live,
}

struct Entry {
    src: String,
    poster: Option<String>,
    mode: Mode,
    path: String,
    epoch: u64,
    rect: Rect,
    clip: Rect,
    hovered: bool,
    /// the reader's own play/pause, overriding autoplay
    user: Option<bool>,
    #[cfg(target_family = "wasm")]
    el: Option<web::Video>,
}

#[derive(Default)]
struct Registry {
    entries: HashMap<String, Entry>,
    epoch: u64,
}

thread_local! {
    static REG: RefCell<Registry> = RefCell::new(Registry::default());
}

/// A new content render is starting: clips it doesn't place again will hide.
pub fn begin_render() {
    REG.with(|r| r.borrow_mut().epoch += 1);
}

/// Where a figure's clip is painted this render. `clip` is the visible part of the page.
pub fn place(key: &str, src: &str, poster: Option<&str>, mode: Mode, rect: Rect, clip: Rect) {
    let path = crate::route::current();
    REG.with(|r| {
        let mut r = r.borrow_mut();
        let epoch = r.epoch;
        let e = r.entries.entry(key.to_string()).or_insert_with(|| Entry {
            src: src.to_string(),
            poster: poster.map(str::to_string),
            mode,
            path: path.clone(),
            epoch,
            rect,
            clip,
            hovered: false,
            user: None,
            #[cfg(target_family = "wasm")]
            el: None,
        });
        e.src = src.to_string();
        e.poster = poster.map(str::to_string);
        e.mode = mode;
        e.path = path;
        e.epoch = epoch;
        e.rect = rect;
        e.clip = clip;
    });
    #[cfg(target_family = "wasm")]
    web::ensure_loop();
}

pub fn hover(key: &str, on: bool) {
    REG.with(|r| {
        if let Some(e) = r.borrow_mut().entries.get_mut(key) {
            e.hovered = on;
        }
    });
}

/// The reader clicked the figure: play if it isn't playing, pause if it is. Returns the new state.
pub fn toggle(key: &str) -> bool {
    let now = !playing(key);
    REG.with(|r| {
        if let Some(e) = r.borrow_mut().entries.get_mut(key) {
            e.user = Some(now);
        }
    });
    now
}

/// Whether the clip is (meant to be) playing: what the figure's lettering should say.
pub fn playing(key: &str) -> bool {
    let reduced = crate::route::reduced_motion();
    REG.with(|r| {
        r.borrow()
            .entries
            .get(key)
            .is_some_and(|e| e.user.unwrap_or(e.mode == Mode::Auto && !reduced))
    })
}

#[cfg(target_family = "wasm")]
mod web {
    use std::cell::{Cell, RefCell};

    use wasm_bindgen::JsCast as _;
    use wasm_bindgen::JsValue;
    use wasm_bindgen::closure::Closure;

    use super::{Mode, REG};

    pub struct Video {
        el: web_sys::HtmlVideoElement,
        src_set: bool,
        css: String,
    }

    impl Drop for Video {
        fn drop(&mut self) {
            self.el.pause().ok();
            self.el.remove();
        }
    }

    thread_local! {
        static LOOP: RefCell<Option<Closure<dyn FnMut()>>> = const { RefCell::new(None) };
        static RUNNING: Cell<bool> = const { Cell::new(false) };
        static NOOP: Closure<dyn FnMut(JsValue)> = Closure::new(|_: JsValue| {});
        /// each media query's list, made once: it stays live, so reading it each frame is enough
        static QUERIES: RefCell<Vec<(&'static str, Option<web_sys::MediaQueryList>)>> = const { RefCell::new(Vec::new()) };
    }

    pub fn matches(query: &'static str) -> bool {
        QUERIES.with(|q| {
            let mut q = q.borrow_mut();
            let i = match q.iter().position(|(k, _)| *k == query) {
                Some(i) => i,
                None => {
                    q.push((
                        query,
                        web_sys::window().and_then(|w| w.match_media(query).ok().flatten()),
                    ));
                    q.len() - 1
                }
            };
            q[i].1.as_ref().is_some_and(|m| m.matches())
        })
    }

    pub fn ensure_loop() {
        if RUNNING.with(|r| r.replace(true)) {
            return;
        }
        LOOP.with(|l| {
            if l.borrow().is_none() {
                *l.borrow_mut() = Some(Closure::new(frame));
            }
        });
        request();
    }

    fn request() {
        LOOP.with(|l| {
            if let (Some(cb), Some(w)) = (l.borrow().as_ref(), web_sys::window()) {
                let _ = w.request_animation_frame(cb.as_ref().unchecked_ref());
            }
        });
    }

    fn frame() {
        if tick() {
            request();
        } else {
            RUNNING.with(|r| r.set(false));
        }
    }

    fn create(poster: Option<&str>, mode: Mode) -> Option<Video> {
        let doc = web_sys::window()?.document()?;
        let el: web_sys::HtmlVideoElement = doc.create_element("video").ok()?.dyn_into().ok()?;
        el.set_muted(true);
        el.set_loop(true);
        for (k, v) in [
            ("muted", ""),
            ("playsinline", ""),
            ("disablepictureinpicture", ""),
            ("disableremoteplayback", ""),
            ("aria-hidden", "true"),
            ("tabindex", "-1"),
            ("preload", if mode == Mode::Auto { "auto" } else { "none" }),
        ] {
            el.set_attribute(k, v).ok();
        }
        if let Some(p) = poster {
            el.set_poster(p);
        }
        el.set_attribute("style", "display:none").ok();
        doc.body()?.append_child(&el).ok()?;
        Some(Video {
            el,
            src_set: false,
            css: String::new(),
        })
    }

    fn play(v: &Video) {
        if let Ok(p) = v.el.play() {
            NOOP.with(|n| {
                let _ = p.catch(n);
            });
        }
    }

    /// One frame: drop clips from other routes, then place, show and play the rest.
    /// Returns whether there is anything left to look after.
    fn tick() -> bool {
        let path = crate::route::current();
        let reduced = matches("(prefers-reduced-motion: reduce)");
        let hover = matches("(hover: hover) and (pointer: fine)");
        REG.with(|r| {
            let mut r = r.borrow_mut();
            r.entries.retain(|_, e| e.path == path);
            if r.entries.is_empty() {
                return false;
            }
            let epoch = r.epoch;
            let suppressed = crate::overlay::blocked();
            // on touch, the live tiles most in view play, two at most
            let mut in_view: Vec<(f32, String)> = r
                .entries
                .iter()
                .filter(|(_, e)| e.mode == Mode::Live && e.epoch == epoch)
                .map(|(k, e)| (e.rect.visible_ratio(&e.clip), k.clone()))
                .filter(|(ratio, _)| *ratio >= 0.6)
                .collect();
            in_view.sort_by(|a, b| b.0.total_cmp(&a.0));
            in_view.truncate(2);

            for (key, e) in r.entries.iter_mut() {
                let inset = e.rect.inset_within(&e.clip);
                let alive = e.epoch == epoch && !suppressed && inset.is_some() && e.rect.w > 1.;
                let want = alive
                    && match e.mode {
                        Mode::Auto => e.user.unwrap_or(!reduced),
                        Mode::Live => {
                            e.user.unwrap_or(!reduced && if hover { e.hovered } else { in_view.iter().any(|(_, k)| k == key) })
                        }
                    };
                if e.el.is_none() {
                    if !alive {
                        continue;
                    }
                    e.el = create(e.poster.as_deref(), e.mode);
                }
                let Some(v) = e.el.as_mut() else { continue };
                if want && !v.src_set {
                    v.el.set_src(&e.src);
                    v.src_set = true;
                }
                let paused = v.el.paused();
                if want && paused {
                    play(v);
                } else if !want && !paused {
                    v.el.pause().ok();
                    if e.mode == Mode::Live {
                        v.el.set_current_time(0.);
                    }
                }
                let has_frame = v.el.ready_state() >= 2;
                let visible = alive
                    && match e.mode {
                        // the clip is the picture: there once it has a frame to show
                        Mode::Auto => v.src_set && has_frame,
                        // the still stays until the motion is actually running
                        Mode::Live => want && has_frame && !paused,
                    };
                let css = match (visible, inset) {
                    (true, Some([t, rt, b, l])) => format!(
                        // moved by transform, not left/top: scrolling then never asks the browser for layout
                        "position:absolute;left:0;top:0;transform:translate3d({:.1}px,{:.1}px,0);will-change:transform;width:{:.1}px;height:{:.1}px;object-fit:cover;\
                         pointer-events:none;z-index:2;margin:0;border:0;background:transparent;\
                         clip-path:inset({t:.1}px {rt:.1}px {b:.1}px {l:.1}px)",
                        e.rect.x, e.rect.y, e.rect.w, e.rect.h
                    ),
                    _ => "display:none".to_string(),
                };
                if css != v.css {
                    v.el.set_attribute("style", &css).ok();
                    v.css = css;
                }
            }
            true
        })
    }
}
