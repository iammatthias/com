//! Cmd/Ctrl+C and Cmd/Ctrl+A, intercepted before dispatch: key events only travel the focus
//! path, which a document inside a page is not on.

use gpui::App;

use super::gesture::Input;
use super::scope::Selection;

pub fn init(cx: &mut App) {
    cx.intercept_keystrokes(|e, window, cx| {
        let m = &e.keystroke.modifiers;
        // either modifier: a browser on a Mac reports the command key, not "secondary"
        if !(m.platform || m.control) || m.alt || m.shift {
            return;
        }
        let input = match e.keystroke.key.as_str() {
            "c" => Input::Copy,
            "a" => Input::SelectAll { whole: None },
            _ => return,
        };
        if let Some(scope) = Selection::active() {
            scope.key(input, window, cx);
        }
    })
    .detach();
    #[cfg(target_family = "wasm")]
    super::web::install();
}
