//! What the browser reports outside GPUI (a diagram drawn, an embed resized, the Find input),
//! brought into the Site: each source keeps a `Signal` in a thread-local and sends to it, and
//! the Site `pump`s what arrives.

use std::cell::RefCell;

use futures::StreamExt as _;
use futures::channel::mpsc::{UnboundedReceiver, UnboundedSender, unbounded};
use gpui::{Context, Task, Window};

/// One listener's channel; sending before anyone subscribes drops the value.
pub struct Signal<T>(RefCell<Option<UnboundedSender<T>>>);

impl<T> Signal<T> {
    pub const fn new() -> Self {
        Self(RefCell::new(None))
    }

    /// The values sent from now on (a second subscriber takes over from the first).
    pub fn subscribe(&self) -> UnboundedReceiver<T> {
        let (tx, rx) = unbounded();
        *self.0.borrow_mut() = Some(tx);
        rx
    }

    pub fn send(&self, value: T) {
        if let Some(tx) = self.0.borrow().as_ref() {
            let _ = tx.unbounded_send(value);
        }
    }
}

/// Apply each value as it arrives, until the view or its window goes.
pub fn pump<V: 'static, T: 'static>(
    window: &Window,
    cx: &mut Context<V>,
    mut rx: UnboundedReceiver<T>,
    apply: impl Fn(&mut V, T, &mut Window, &mut Context<V>) + 'static,
) -> Task<()> {
    cx.spawn_in(window, async move |this, cx| {
        while let Some(value) = rx.next().await {
            if this
                .update_in(cx, |view, window, cx| apply(view, value, window, cx))
                .is_err()
            {
                break;
            }
        }
    })
}
