use gpui::{ElementId, Window};

use super::scope;

fn key(id: &ElementId) -> String {
    id.to_string()
}

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
    static PAGE_VIEW: std::cell::Cell<Option<gpui::EntityId>> = const { std::cell::Cell::new(None) };
}

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

pub fn clear_slot(key: &str) {
    let old = scope::with(|p| &p.slots, |s| s.borrow_mut().remove(key));
    drop(old);
}

pub fn set_page_view(id: gpui::EntityId) {
    PAGE_VIEW.with(|v| v.set(Some(id)));
}

pub fn redraw_page(cx: &mut gpui::App) {
    use gpui::AppContext as _;
    match PAGE_VIEW.with(|v| v.get()) {
        Some(id) => cx.notify(id),
        None => cx.refresh_windows(),
    }
}

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
