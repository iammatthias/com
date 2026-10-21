//! "Find a title": the query in `Home`, matched by title and tag at once and, a moment after the
//! typing rests, by meaning in the semantic search worker.

use std::time::Duration;

use futures::channel::mpsc::{UnboundedReceiver, unbounded};
use gpui::{Context, Task, Window};

use super::Site;
use crate::dom_input::Event;
use crate::search::{Hit, Reply, Search};

/// Longest Find query, characters; typing past it is ignored.
pub const MAX_QUERY: usize = 60;
/// How long the typing rests before the plate is re-lettered and the worker asked (lettering
/// rebuilds the whole atlas, too much for every key).
const SETTLE: Duration = Duration::from_millis(120);
/// Hits asked of the worker.
const TOP_K: u32 = 6;

pub struct Find {
    search: Search,
    /// the query last sent to the worker
    sent: String,
    /// the worker's answer, under the query it answers: the field may have moved on since
    hits: Option<(String, Vec<Hit>)>,
    /// the typing resting, after which the query is acted on
    settle: Option<Task<()>>,
}

impl Find {
    /// Start the search worker, and the replies it sends from outside GPUI.
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

    /// The worker's hits for `query`, once it has answered that query.
    pub fn hits_for(&self, query: &str) -> Option<&[Hit]> {
        self.hits
            .as_ref()
            .filter(|(q, _)| q == query.trim())
            .map(|(_, h)| h.as_slice())
    }
}

impl Site {
    /// Put the caret in "Find a title" (within the tap or key that asked: a phone raises its
    /// keyboard only then), and start loading the search model.
    pub fn focus_search(&mut self, cx: &mut Context<Self>) {
        crate::dom_input::focus();
        self.find.search.warm();
        cx.notify();
    }

    /// What the Find input reported.
    pub(super) fn on_find(&mut self, event: Event, window: &mut Window, cx: &mut Context<Self>) {
        match event {
            Event::Text(text) => {
                // the input's maxlength holds it to MAX_QUERY; a paste past it is cut there
                self.home.query = text.chars().take(MAX_QUERY).collect();
                self.find.search.warm();
            }
            Event::Escape => {
                if self.home.query.is_empty() {
                    self.home.open = None;
                }
                self.home.query.clear();
            }
            Event::Submit => {
                // the first result shown: a title or tag match, else the best by meaning
                let by_meaning = self
                    .find
                    .hits_for(&self.home.query)
                    .and_then(|h| h.first())
                    .map(|h| h.href.clone());
                let first = self
                    .index
                    .as_ref()
                    .and_then(|i| self.home.matches(i).first().map(|it| it.href.clone()))
                    .or(by_meaning);
                let Some(href) = first else { return };
                self.home.query.clear();
                // lettered now: a retitle still waiting would letter the spiral round the next page
                self.find.settle = None;
                self.retitle(cx);
                // as a link would: a document or another site's page opens in a new tab
                (self.nav.clone())(href, window, cx);
                return;
            }
        }
        self.settle_search(cx);
        cx.notify();
    }

    /// Once the typing rests, re-letter the plate and ask the worker; an empty field clears its
    /// answers at once.
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
                // typed past while it was on its way: the next answer will do
                if self.find.sent == self.home.query.trim() {
                    self.find.hits = Some((self.find.sent.clone(), hits));
                    cx.notify();
                }
            }
            Reply::Error { message, .. } => {
                #[cfg(target_family = "wasm")]
                web_sys::console::warn_1(&format!("search: {message}").into());
                let _ = message;
            }
            _ => {}
        }
    }
}
