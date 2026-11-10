use std::cell::RefCell;

use futures::StreamExt as _;
use futures::channel::mpsc::{UnboundedReceiver, UnboundedSender, unbounded};
use gpui::{Context, Task, Window};

pub struct Signal<T>(RefCell<Option<UnboundedSender<T>>>);

impl<T> Signal<T> {
    pub const fn new() -> Self {
        Self(RefCell::new(None))
    }

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
