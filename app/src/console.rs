pub fn warn(message: &str) {
    #[cfg(target_family = "wasm")]
    web_sys::console::warn_1(&message.into());
    #[cfg(not(target_family = "wasm"))]
    eprintln!("{message}");
}
