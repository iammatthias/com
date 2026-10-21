//! Every fixed maximum has a named fallback (what happens past it); `reached` reports, once per
//! name, that one ran, so a limit met in use shows in the console instead of passing silently.

use std::cell::RefCell;
use std::collections::HashSet;

thread_local! {
    static SEEN: RefCell<HashSet<&'static str>> = RefCell::new(HashSet::new());
}

/// `what` names the limit and its fallback, e.g. "prefetches in flight (4): the rest wait".
pub fn reached(what: &'static str) {
    if !SEEN.with(|s| s.borrow_mut().insert(what)) {
        return;
    }
    #[cfg(target_family = "wasm")]
    web_sys::console::warn_1(&format!("limit reached: {what}").into());
    #[cfg(not(target_family = "wasm"))]
    eprintln!("limit reached: {what}");
}
