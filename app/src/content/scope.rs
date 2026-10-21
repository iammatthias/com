//! What the page showing keeps outside GPUI, in one place: let go of all at once when the next
//! payload is set (`forget_page`). Caches that outlive a page (parsed trees, diagrams,
//! banners) keep their own.

use std::any::Any;
use std::cell::RefCell;
use std::collections::HashMap;

use super::{feed, lightbox, toc};

#[derive(Default)]
pub(super) struct PageScope {
    /// view-local values by element id (`state::get`/`update`)
    pub state: RefCell<HashMap<String, Box<dyn Any>>>,
    /// focus handles, running tasks (`state::slot`)
    pub slots: RefCell<HashMap<String, Box<dyn Any>>>,
    /// where each heading was painted, for the contents to jump to
    pub toc: RefCell<HashMap<String, toc::Spot>>,
    /// where each image was last painted: (top, bottom) in window px
    pub near_places: RefCell<HashMap<String, (f32, f32)>>,
    /// whether the last render decoded each image
    pub near_decided: RefCell<HashMap<String, bool>>,
    /// the feed's later pages, once the end has come near
    pub more: RefCell<Option<feed::More>>,
    /// the URL each image was first fetched at (payload key, source): a resized window would
    /// otherwise ask for every image again at the new width, each another decode held
    pub chosen: RefCell<HashMap<(String, String), String>>,
    pub lightbox: RefCell<Option<lightbox::Open>>,
}

thread_local! {
    static SCOPE: PageScope = PageScope::default();
}

/// `f` with one of the page's cells.
pub(super) fn with<T, R>(
    field: fn(&PageScope) -> &RefCell<T>,
    f: impl FnOnce(&RefCell<T>) -> R,
) -> R {
    SCOPE.with(|s| f(field(s)))
}

/// A new page: drop everything the last one kept (its tasks are cancelled as they drop, after
/// every cell is released, so nothing dropping finds one borrowed).
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
