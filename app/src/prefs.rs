//! Small per-visitor conveniences (the chosen view, the chosen paper), kept in
//! localStorage. Nothing here is needed for the site to work; every read can fail.

const PREFIX: &str = "burin.";

#[cfg(target_family = "wasm")]
fn storage() -> Option<web_sys::Storage> {
    web_sys::window()?.local_storage().ok().flatten()
}

pub fn get(key: &str) -> Option<String> {
    #[cfg(target_family = "wasm")]
    {
        return storage()?
            .get_item(&format!("{PREFIX}{key}"))
            .ok()
            .flatten();
    }
    #[allow(unreachable_code)]
    {
        let _ = (PREFIX, key);
        None
    }
}

pub fn set(key: &str, value: &str) {
    #[cfg(target_family = "wasm")]
    if let Some(s) = storage() {
        let _ = s.set_item(&format!("{PREFIX}{key}"), value);
    }
    #[cfg(not(target_family = "wasm"))]
    let _ = (key, value);
}
