//! Video the canvas can't draw: a real `<video>` laid over the canvas where a figure is painted.
//!
//! GPUI has no video decoder on the web, so a figure that holds a clip reports its painted
//! bounds here (from a canvas probe in its prepaint) and this module keeps one muted, looping,
//! inline `<video>` per clip in `document.body`, `position: absolute` (the page never scrolls; iOS won't paint fixed content under its toolbars) above the canvas with
//! `pointer-events: none` (so hover and clicks still reach GPUI), clipped to the scroll
//! viewport.
//!
//! Clips belong to the render that placed them. The page is a cached view: it only renders
//! (and so only re-places its clips) when something changes. Each content render starts a new
//! epoch; a clip not placed in the latest epoch is hidden.
//!
//! `prefers-reduced-motion` turns autoplay off: the figure shows its poster and a "play"
//! that starts the clip. Live tiles (a still with motion behind it) play on hover where
//! there is hover, and while well in view (at most two) where there isn't.

use std::cell::RefCell;
use std::collections::HashMap;

use crate::overlay::{Extent, Gate, Layer, Rect, Stage};

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
    rect: Rect,
    clip: Rect,
    hovered: bool,
    /// the reader's own play/pause, overriding autoplay
    user: Option<bool>,
    #[cfg(target_family = "wasm")]
    el: Option<web::Video>,
}

thread_local! {
    static CLIPS: RefCell<Layer<Entry>> = RefCell::new(Layer::new(Gate::Page, Extent::Viewport));
    /// each clip's own width over height, by source, once its `<video>` has read it
    static ASPECTS: RefCell<HashMap<String, f32>> = RefCell::new(HashMap::new());
    static RESIZED: crate::site::signal::Signal<()> = const { crate::site::signal::Signal::new() };
}

/// A signal whenever a clip's own size comes in, so its figure takes that shape.
pub fn subscribe() -> futures::channel::mpsc::UnboundedReceiver<()> {
    RESIZED.with(|r| r.subscribe())
}

/// The clip's width over height, from the video itself, once it is known.
pub fn aspect(src: &str) -> Option<f32> {
    ASPECTS.with(|a| a.borrow().get(src).copied())
}

#[cfg_attr(not(target_family = "wasm"), allow(dead_code))]
fn learned(src: &str, aspect: f32) {
    let changed = ASPECTS.with(|a| {
        a.borrow_mut()
            .insert(src.to_string(), aspect)
            .is_none_or(|old| (old - aspect).abs() > 0.001)
    });
    if changed {
        RESIZED.with(|r| r.send(()));
    }
}

/// A new content render is starting: clips it doesn't place again will hide.
pub fn begin_render() {
    CLIPS.with(|clips| clips.borrow_mut().begin());
    wake();
}

pub fn turn_to(page: &str, stage: Stage) {
    let (changed, gone) = CLIPS.with(|clips| {
        let mut clips = clips.borrow_mut();
        (clips.set_stage(stage), clips.turn_to(page))
    });
    drop(gone);
    if changed {
        wake();
    }
}

pub fn clear() {
    let gone = CLIPS.with(|clips| clips.borrow_mut().clear());
    drop(gone);
}

/// Where a figure's clip is painted this render. `clip` is the visible part of the page.
pub fn place(key: &str, src: &str, poster: Option<&str>, mode: Mode, rect: Rect, clip: Rect) {
    CLIPS.with(|clips| {
        let mut clips = clips.borrow_mut();
        let e = clips.place(key, || Entry {
            src: String::new(),
            poster: None,
            mode,
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
        e.rect = rect;
        e.clip = clip;
    });
    wake();
}

pub fn hover(key: &str, on: bool) {
    CLIPS.with(|clips| {
        if let Some(e) = clips.borrow_mut().get_mut(key) {
            e.hovered = on;
        }
    });
    wake();
}

/// The reader clicked the figure: play if it isn't playing, pause if it is. Returns the new state.
pub fn toggle(key: &str) -> bool {
    let now = !playing(key);
    CLIPS.with(|clips| {
        if let Some(e) = clips.borrow_mut().get_mut(key) {
            e.user = Some(now);
        }
    });
    wake();
    now
}

/// Whether the clip is (meant to be) playing: what the figure's lettering should say.
pub fn playing(key: &str) -> bool {
    let reduced = crate::browser::reduced_motion();
    CLIPS.with(|clips| {
        clips
            .borrow()
            .get(key)
            .is_some_and(|e| e.user.unwrap_or(e.mode == Mode::Auto && !reduced))
    })
}

pub fn wake() {
    #[cfg(target_family = "wasm")]
    web::wake();
}

#[cfg(target_family = "wasm")]
mod web {
    use std::cell::{Cell, RefCell};

    use wasm_bindgen::JsCast as _;
    use wasm_bindgen::JsValue;
    use wasm_bindgen::closure::Closure;

    use super::{CLIPS, Mode, learned};

    const WAKING_EVENTS: [&str; 11] = [
        "loadedmetadata",
        "loadeddata",
        "canplay",
        "playing",
        "pause",
        "waiting",
        "stalled",
        "seeked",
        "emptied",
        "resize",
        "error",
    ];

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
        static WOKEN: Cell<bool> = const { Cell::new(false) };
        static WAKE: Closure<dyn FnMut()> = Closure::new(wake);
        static NOOP: Closure<dyn FnMut(JsValue)> = Closure::new(|_: JsValue| {});
        static QUERIES: RefCell<Vec<(&'static str, Option<web_sys::MediaQueryList>)>> = const { RefCell::new(Vec::new()) };
    }

    pub fn matches(query: &'static str) -> bool {
        QUERIES.with(|q| {
            let mut q = q.borrow_mut();
            let i = match q.iter().position(|(k, _)| *k == query) {
                Some(i) => i,
                None => {
                    let list = web_sys::window().and_then(|w| w.match_media(query).ok().flatten());
                    if let Some(list) = list.as_ref() {
                        listen(list, "change");
                    }
                    q.push((query, list));
                    q.len() - 1
                }
            };
            q[i].1.as_ref().is_some_and(|m| m.matches())
        })
    }

    fn listen(target: &web_sys::EventTarget, event: &str) {
        WAKE.with(|wake| {
            let _ = target.add_event_listener_with_callback(event, wake.as_ref().unchecked_ref());
        });
    }

    pub fn wake() {
        WOKEN.set(true);
        if RUNNING.replace(true) {
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
        WOKEN.set(false);
        let unsettled = tick();
        if unsettled || WOKEN.get() {
            request();
        } else {
            RUNNING.set(false);
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
        for event in WAKING_EVENTS {
            listen(&el, event);
        }
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

    fn tick() -> bool {
        let reduced = matches("(prefers-reduced-motion: reduce)");
        let hover = matches("(hover: hover) and (pointer: fine)");
        CLIPS.with(|clips| {
            let mut clips = clips.borrow_mut();
            let suppressed = clips.gated();
            // on touch, the live tiles most in view play, two at most
            let mut in_view: Vec<(f32, String)> = clips
                .iter()
                .filter(|(_, placed, e)| e.mode == Mode::Live && *placed)
                .map(|(k, _, e)| (e.rect.visible_ratio(&e.clip), k.to_string()))
                .filter(|(ratio, _)| *ratio >= 0.6)
                .collect();
            in_view.sort_by(|a, b| b.0.total_cmp(&a.0));
            in_view.truncate(2);

            let mut unsettled = false;
            for (key, placed, e) in clips.iter_mut() {
                let inset = e.rect.inset_within(&e.clip);
                let alive = placed && !suppressed && inset.is_some() && e.rect.w > 1.;
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
                    unsettled = true;
                }
                let Some(v) = e.el.as_mut() else { continue };
                // a figure's clip loads even before it plays: its own size is the figure's shape
                if (want || e.mode == Mode::Auto) && !v.src_set {
                    v.el.set_src(&e.src);
                    v.src_set = true;
                    unsettled = true;
                }
                let (w, h) = (v.el.video_width(), v.el.video_height());
                let sized = w > 0 && h > 0;
                if e.mode == Mode::Auto && sized {
                    learned(&e.src, w as f32 / h as f32);
                }
                let paused = v.el.paused();
                if want && paused {
                    play(v);
                    unsettled = true;
                } else if !want && !paused {
                    v.el.pause().ok();
                    if e.mode == Mode::Live {
                        v.el.set_current_time(0.);
                    }
                    unsettled = true;
                }
                let has_frame = v.el.ready_state() >= 2;
                let visible = alive
                    && match e.mode {
                        // the clip is the picture: there once it has a frame to show
                        Mode::Auto => v.src_set && has_frame,
                        // the still stays until the motion is actually running
                        Mode::Live => want && has_frame && !paused,
                    };
                // a clip that is the figure is never cropped: its box can be a guess (blobs may not
                // know a video's size), so it letterboxes. A live tile fills its still's frame.
                let fit = match e.mode {
                    Mode::Auto => "contain",
                    Mode::Live => "cover",
                };
                let css = match (visible, inset) {
                    (true, Some([t, rt, b, l])) => format!(
                        // moved by transform, not left/top: scrolling then never asks the browser for layout
                        "position:absolute;left:0;top:0;transform:translate3d({:.1}px,{:.1}px,0);will-change:transform;width:{:.1}px;height:{:.1}px;object-fit:{fit};\
                         pointer-events:none;z-index:2;margin:0;border:0;background:transparent;\
                         clip-path:inset({t:.1}px {rt:.1}px {b:.1}px {l:.1}px)",
                        e.rect.x, e.rect.y, e.rect.w, e.rect.h
                    ),
                    _ => "display:none".to_string(),
                };
                if css != v.css {
                    v.el.set_attribute("style", &css).ok();
                    v.css = css;
                    unsettled = true;
                }
                let awaited = match e.mode {
                    Mode::Auto => !sized || (alive && !has_frame),
                    Mode::Live => want && !has_frame,
                };
                let loading = v.src_set
                    && v.el.network_state() != web_sys::HtmlMediaElement::NETWORK_NO_SOURCE;
                unsettled |= awaited && loading;
            }
            unsettled
        })
    }
}
