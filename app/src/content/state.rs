//! View-local state (open disclosures, recipe serves and struck ingredients, hovered links),
//! keyed by the element id that owns it. Lives outside GPUI's element-state map so it
//! survives however the site view chooses to re-render; a change asks the window to redraw.

use gpui::{ElementId, Window};

use super::scope;

fn key(id: &ElementId) -> String {
    id.to_string()
}

/// The current value for `id`, or `T::default()` if nothing has been set.
pub fn get<T: Clone + Default + 'static>(id: &ElementId) -> T {
    scope::with(
        |p| &p.state,
        |s| {
            s.borrow()
                .get(&key(id))
                .and_then(|b| b.downcast_ref::<T>())
                .cloned()
                .unwrap_or_default()
        },
    )
}

thread_local! {
    /// The view the page renders in, so work finishing outside a render can redraw just it.
    static PAGE_VIEW: std::cell::Cell<Option<gpui::EntityId>> = const { std::cell::Cell::new(None) };
}

/// The value kept under `key` (things that are neither `Clone` nor comparable: focus handles,
/// running tasks), made by `init` on first use. `f` must not reach for another slot.
pub fn slot<T: 'static, R>(key: &str, init: impl FnOnce() -> T, f: impl FnOnce(&mut T) -> R) -> R {
    scope::with(
        |p| &p.slots,
        |s| {
            let mut s = s.borrow_mut();
            let fresh = s.get(key).is_none_or(|b| b.downcast_ref::<T>().is_none());
            if fresh {
                s.insert(key.to_string(), Box::new(init()));
            }
            let entry = s.get_mut(key).expect("slot");
            f(entry.downcast_mut::<T>().expect("slot type"))
        },
    )
}

/// Forget what is kept under `key` (dropping a task cancels it).
pub fn clear_slot(key: &str) {
    let old = scope::with(|p| &p.slots, |s| s.borrow_mut().remove(key));
    drop(old);
}

/// Remember which view is rendering the page (called at the top of each content render).
pub fn set_page_view(id: gpui::EntityId) {
    PAGE_VIEW.with(|v| v.set(Some(id)));
}

/// Ask the page to render again from outside a render pass: a timer tick, a fetch landing.
/// The page is a cached view, so only notifying it (or refreshing the window) redraws it.
pub fn redraw_page(cx: &mut gpui::App) {
    use gpui::AppContext as _;
    match PAGE_VIEW.with(|v| v.get()) {
        Some(id) => cx.notify(id),
        None => cx.refresh_windows(),
    }
}

/// Change the value for `id` and redraw if it actually changed.
pub fn update<T: Clone + Default + PartialEq + 'static>(
    id: &ElementId,
    window: &mut Window,
    f: impl FnOnce(&mut T),
) {
    let changed = scope::with(
        |p| &p.state,
        |s| {
            let mut s = s.borrow_mut();
            let entry = s.entry(key(id)).or_insert_with(|| Box::new(T::default()));
            let Some(v) = entry.downcast_mut::<T>() else {
                *entry = Box::new(T::default());
                return true;
            };
            let before = v.clone();
            f(v);
            *v != before
        },
    );
    if changed {
        window.refresh();
    }
}
