//! Images decode only near the screen. A probe under each figure records where it was
//! painted; the figure renders its `img` only while that is within about a screen of the
//! window, and the page's cache drops whatever the latest render stopped asking for. A long
//! gallery holds a couple of screens of decoded images, not all of them.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::sync::Arc;

use gpui::prelude::*;
use gpui::{
    AnyElement, App, Entity, ImageCache, ImageCacheError, RenderImage, Resource,
    RetainAllImageCache, WeakEntity, Window, div,
};

use super::scope;

thread_local! {
    /// the view to re-render when an image crosses the line
    static VIEW: RefCell<Option<Box<dyn Fn(&mut App)>>> = const { RefCell::new(None) };
    static PENDING: Cell<bool> = const { Cell::new(false) };
    /// the window's height at the current render
    static VH: Cell<f32> = const { Cell::new(900.0) };
}

/// Re-render `view` when an image comes near or goes far; call as it renders.
pub fn watch<V: 'static>(view: WeakEntity<V>, window: &Window) {
    VH.set(window.viewport_size().height.into());
    VIEW.with(|v| {
        *v.borrow_mut() = Some(Box::new(move |cx: &mut App| {
            let _ = view.update(cx, |_, cx| cx.notify());
        }))
    });
}

fn is_near(top: f32, bottom: f32, vh: f32) -> bool {
    bottom > -vh && top < 2.0 * vh
}

/// Should the image `key` be decoded this render? Not until it has been placed once.
pub fn near(key: &str) -> bool {
    let vh = VH.get();
    let near = scope::with(
        |s| &s.near_places,
        |p| p.borrow().get(key).is_some_and(|&(t, b)| is_near(t, b, vh)),
    );
    scope::with(
        |s| &s.near_decided,
        |d| d.borrow_mut().insert(key.to_string(), near),
    );
    near
}

/// Fills its (relative) parent and records where the image `key` lands.
pub fn probe(key: String) -> AnyElement {
    div()
        .absolute()
        .inset_0()
        .child(
            gpui::canvas(
                move |bounds, window, _| {
                    let (top, bottom) = (f32::from(bounds.top()), f32::from(bounds.bottom()));
                    scope::with(
                        |s| &s.near_places,
                        |p| p.borrow_mut().insert(key.clone(), (top, bottom)),
                    );
                    let vh: f32 = window.viewport_size().height.into();
                    let now = is_near(top, bottom, vh);
                    let decided =
                        scope::with(|s| &s.near_decided, |d| d.borrow().get(&key).copied());
                    if decided != Some(now) && !PENDING.get() {
                        PENDING.set(true);
                        window.on_next_frame(|_, cx| {
                            PENDING.set(false);
                            VIEW.with(|v| {
                                if let Some(f) = v.borrow().as_ref() {
                                    f(cx);
                                }
                            });
                        });
                    }
                },
                |_, _, _, _| {},
            )
            .size_full(),
        )
        .into_any_element()
}

/// The page's image cache: what a render's layout doesn't ask for is dropped at the next render.
pub struct NearCache {
    inner: Entity<RetainAllImageCache>,
    generation: u64,
    used: HashMap<Resource, u64>,
}

impl NearCache {
    pub fn new(cx: &mut App) -> Entity<Self> {
        let inner = RetainAllImageCache::new(cx);
        cx.new(|_| Self {
            inner,
            generation: 0,
            used: HashMap::new(),
        })
    }

    /// Call at the top of each render: frees images the last layout didn't use.
    pub fn sweep(&mut self, window: &mut Window, cx: &mut App) {
        let generation = self.generation;
        let stale: Vec<Resource> = self
            .used
            .iter()
            .filter(|(_, g)| **g < generation)
            .map(|(r, _)| r.clone())
            .collect();
        for resource in stale {
            self.used.remove(&resource);
            self.inner
                .update(cx, |c, cx| c.remove(&resource, window, cx));
        }
        self.generation += 1;
    }
}

impl ImageCache for NearCache {
    fn load(
        &mut self,
        resource: &Resource,
        window: &mut Window,
        cx: &mut App,
    ) -> Option<Result<Arc<RenderImage>, ImageCacheError>> {
        self.used.insert(resource.clone(), self.generation);
        self.inner.update(cx, |c, cx| c.load(resource, window, cx))
    }
}
