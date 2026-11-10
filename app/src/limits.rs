use std::cell::RefCell;
use std::collections::HashSet;

thread_local! {
    static SEEN: RefCell<HashSet<&'static str>> = RefCell::new(HashSet::new());
}

pub fn reached(what: &'static str) {
    if !SEEN.with(|s| s.borrow_mut().insert(what)) {
        return;
    }
    crate::console::warn(&format!("limit reached: {what}"));
}
