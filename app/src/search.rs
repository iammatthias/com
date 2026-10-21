//! Semantic search, off the main thread: a module Web Worker (assets/search) runs
//! ternlight over the site's corpus and answers queries with ranked hits. Results
//! come back as JSON strings through a channel the Site listens on.

use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct Hit {
    pub href: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Reply {
    Ready,
    Results { id: u32, hits: Vec<Hit> },
    Error { message: String },
}

#[cfg(target_family = "wasm")]
#[wasm_bindgen::prelude::wasm_bindgen(module = "/js/dom.js")]
extern "C" {
    #[wasm_bindgen(js_name = buildUrl)]
    fn build_url(path: &str) -> String;
}

pub struct Search {
    #[cfg(target_family = "wasm")]
    worker: Option<web_sys::Worker>,
    /// the worker's script didn't load: the next message starts another (a new worker has its
    /// own module map, so an import that failed in the last one is fetched again)
    #[cfg(target_family = "wasm")]
    dead: std::rc::Rc<std::cell::Cell<bool>>,
    #[cfg(target_family = "wasm")]
    on_reply: std::rc::Rc<dyn Fn(Reply)>,
    /// workers started after the first: a script that keeps failing isn't asked for forever
    #[cfg(target_family = "wasm")]
    respawns: u32,
    next_id: u32,
    warmed: bool,
}

impl Search {
    /// Start the worker; every reply is handed to `on_reply` as it arrives.
    pub fn start(on_reply: impl Fn(Reply) + 'static) -> Self {
        #[cfg(target_family = "wasm")]
        {
            let mut search = Self {
                worker: None,
                dead: Default::default(),
                on_reply: std::rc::Rc::new(on_reply),
                respawns: 0,
                next_id: 0,
                warmed: false,
            };
            search.spawn();
            search
        }
        #[cfg(not(target_family = "wasm"))]
        {
            let _ = on_reply;
            Self {
                next_id: 0,
                warmed: false,
            }
        }
    }

    #[cfg(target_family = "wasm")]
    fn spawn(&mut self) {
        use wasm_bindgen::JsCast as _;
        use wasm_bindgen::closure::Closure;
        let options = web_sys::WorkerOptions::new();
        options.set_type(web_sys::WorkerType::Module);
        if let Some(old) = self.worker.take() {
            old.terminate();
        }
        self.dead.set(false);
        let Ok(w) =
            web_sys::Worker::new_with_options(&build_url("search/search-worker.js"), &options)
        else {
            return;
        };
        let on_reply = self.on_reply.clone();
        let cb = Closure::<dyn Fn(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
            if let Some(text) = e.data().as_string() {
                if let Ok(reply) = serde_json::from_str::<Reply>(&text) {
                    on_reply(reply);
                }
            }
        });
        w.set_onmessage(Some(cb.as_ref().unchecked_ref()));
        cb.forget();
        let dead = self.dead.clone();
        let cb = Closure::<dyn Fn(web_sys::Event)>::new(move |_: web_sys::Event| dead.set(true));
        w.set_onerror(Some(cb.as_ref().unchecked_ref()));
        cb.forget();
        self.worker = Some(w);
    }

    /// Load the model and the index ahead of the first query.
    pub fn warm(&mut self) {
        if self.warmed {
            return;
        }
        self.warmed = true;
        self.post(WARM);
    }

    /// Ask for the top hits; replies carry the returned id so stale answers can be dropped.
    pub fn query(&mut self, text: &str, top_k: u32) -> u32 {
        self.warm();
        self.next_id += 1;
        let msg = serde_json::json!({ "type": "search", "id": self.next_id, "query": text, "topK": top_k });
        self.post(&msg.to_string());
        self.next_id
    }

    pub fn latest(&self) -> u32 {
        self.next_id
    }

    fn post(&mut self, json: &str) {
        #[cfg(target_family = "wasm")]
        {
            if self.dead.get() && self.respawns < RESPAWNS {
                self.respawns += 1;
                self.spawn();
                if self.warmed && json != WARM {
                    self.post_now(WARM);
                }
            }
            self.post_now(json);
        }
        #[cfg(not(target_family = "wasm"))]
        let _ = json;
    }

    #[cfg(target_family = "wasm")]
    fn post_now(&self, json: &str) {
        if let (Some(w), Ok(v)) = (self.worker.as_ref(), js_sys::JSON::parse(json)) {
            let _ = w.post_message(&v);
        }
    }
}

const WARM: &str = r#"{"type":"warm"}"#;
/// workers started again after their script failed to load, at most
#[cfg(target_family = "wasm")]
const RESPAWNS: u32 = 3;
