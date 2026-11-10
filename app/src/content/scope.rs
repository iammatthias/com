use std::any::Any;
use std::cell::RefCell;
use std::collections::HashMap;

use super::{feed, lightbox, toc};

#[derive(Default)]
pub(super) struct PageScope {
    pub state: RefCell<HashMap<String, Box<dyn Any>>>,
    pub slots: RefCell<HashMap<String, Box<dyn Any>>>,
    pub toc: RefCell<HashMap<usize, toc::Spot>>,
    pub near_places: RefCell<HashMap<String, (f32, f32)>>,
    pub near_decided: RefCell<HashMap<String, bool>>,
    pub more: RefCell<Option<feed::More>>,
    pub chosen: RefCell<HashMap<(String, String), String>>,
    pub lightbox: RefCell<Option<lightbox::Open>>,
}

thread_local! {
    static SCOPE: PageScope = PageScope::default();
}

pub(super) fn with<T, R>(
    field: fn(&PageScope) -> &RefCell<T>,
    f: impl FnOnce(&RefCell<T>) -> R,
) -> R {
    SCOPE.with(|s| f(field(s)))
}

pub(super) fn reset() {
    let old = SCOPE.with(|s| PageScope {
        state: s.state.take().into(),
        slots: s.slots.take().into(),
        toc: s.toc.take().into(),
        near_places: s.near_places.take().into(),
        near_decided: s.near_decided.take().into(),
        more: s.more.take().into(),
        chosen: s.chosen.take().into(),
        lightbox: s.lightbox.take().into(),
    });
    if old.lightbox.borrow().is_some() {
        crate::overlay::set_lightbox(false);
    }
    drop(old);
}
