use std::time::Duration;

use futures::channel::mpsc::{UnboundedReceiver, unbounded};
use gpui::{Context, Task, Window};

use super::Site;
use crate::dom_input::Event;
use crate::drawers::Drawer;
use crate::search::{Hit, Reply, Search};

pub const MAX_QUERY: usize = 60;
const SETTLE: Duration = Duration::from_millis(120);
const TOP_K: u32 = 6;

pub struct Find {
    search: Search,
    sent: String,
    hits: Option<(String, Vec<Hit>)>,
    settle: Option<Task<()>>,
}

impl Find {
    pub fn start() -> (Self, UnboundedReceiver<Reply>) {
        let (tx, rx) = unbounded::<Reply>();
        let search = Search::start(move |reply| {
            let _ = tx.unbounded_send(reply);
        });
        (
            Self {
                search,
                sent: String::new(),
                hits: None,
                settle: None,
            },
            rx,
        )
    }

    pub fn hits_for(&self, query: &str) -> Option<&[Hit]> {
        self.hits
            .as_ref()
            .filter(|(q, _)| q == query.trim())
            .map(|(_, h)| h.as_slice())
    }
}

impl Site {
    pub fn focus_search(&mut self, cx: &mut Context<Self>) {
        crate::dom_input::focus();
        self.find.search.warm();
        cx.notify();
    }

    pub fn open_panel(&mut self, panel: Option<Drawer>, cx: &mut Context<Self>) {
        self.home.open = panel;
        if panel == Some(Drawer::Find) {
            self.focus_search(cx);
        }
        cx.notify();
    }

    fn clear_query(&mut self) {
        self.home.query.clear();
        crate::dom_input::clear();
    }

    pub(super) fn on_find(&mut self, event: Event, window: &mut Window, cx: &mut Context<Self>) {
        match event {
            Event::Text(text) => {
                self.home.query = text.chars().take(MAX_QUERY).collect();
                self.find.search.warm();
            }
            Event::Escape => {
                if self.home.query.is_empty() {
                    self.open_panel(None, cx);
                }
                self.clear_query();
            }
            Event::Submit => {
                let by_meaning = self.find.hits_for(&self.home.query).unwrap_or_default();
                let results = self.home.results(self.index.ready(), by_meaning);
                let Some((_, href)) = results.into_iter().next() else {
                    return;
                };
                self.clear_query();
                self.find.settle = None;
                self.retitle(cx);
                (self.nav.clone())(href, window, cx);
                return;
            }
        }
        self.settle_search(cx);
        cx.notify();
    }

    fn settle_search(&mut self, cx: &mut Context<Self>) {
        let q = self.home.query.trim().to_string();
        if q.is_empty() {
            self.find.hits = None;
        }
        self.find.settle = Some(cx.spawn(async move |this, cx| {
            cx.background_executor().timer(SETTLE).await;
            let _ = this.update(cx, |site, cx| {
                site.retitle(cx);
                if !q.is_empty() {
                    site.find.search.query(&q, TOP_K);
                    site.find.sent = q;
                }
                cx.notify();
            });
        }));
    }

    pub(super) fn on_search_reply(&mut self, reply: Reply, cx: &mut Context<Self>) {
        match reply {
            Reply::Results { id, hits } if id == self.find.search.latest() => {
                if self.find.sent == self.home.query.trim() {
                    self.find.hits = Some((self.find.sent.clone(), hits));
                    cx.notify();
                }
            }
            Reply::Error { message, .. } => {
                crate::console::warn(&format!("search: {message}"));
            }
            _ => {}
        }
    }
}
