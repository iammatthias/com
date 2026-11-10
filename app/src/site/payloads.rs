use std::collections::{HashMap, HashSet, VecDeque};

use gpui::Task;

use crate::api::RoutePayload;
use crate::limits;

const MAX_KEPT: usize = 32;
const KEPT_REACHED: &str = "pages kept (32): the oldest goes";
const MAX_IN_FLIGHT: usize = 4;
const IN_FLIGHT_REACHED: &str = "prefetches in flight (4): the next waits for a later hover";
const MAX_FAILED: usize = 32;
const FAILED_REACHED: &str = "failed prefetches remembered (32): all are tried again";

#[derive(Default)]
pub struct Payloads {
    kept: HashMap<String, RoutePayload>,
    order: VecDeque<String>,
    in_flight: HashMap<String, Task<()>>,
    failed: HashSet<String>,
}

impl Payloads {
    pub fn get(&self, path: &str) -> Option<RoutePayload> {
        self.kept.get(path).cloned()
    }

    pub fn remember(&mut self, path: String, payload: RoutePayload) {
        if self.kept.insert(path.clone(), payload).is_none() {
            self.order.push_back(path);
        }
        while self.order.len() > MAX_KEPT {
            limits::reached(KEPT_REACHED);
            if let Some(old) = self.order.pop_front() {
                self.kept.remove(&old);
            }
        }
    }

    pub fn should_prefetch(&self, path: &str) -> bool {
        if self.kept.contains_key(path)
            || self.in_flight.contains_key(path)
            || self.failed.contains(path)
        {
            return false;
        }
        if self.in_flight.len() >= MAX_IN_FLIGHT {
            limits::reached(IN_FLIGHT_REACHED);
            return false;
        }
        true
    }

    pub fn prefetching(&mut self, path: String, task: Task<()>) {
        self.in_flight.insert(path, task);
    }

    pub fn prefetched(&mut self, path: String, payload: Option<RoutePayload>) {
        self.in_flight.remove(&path);
        match payload {
            Some(p) => self.remember(path, p),
            None => {
                if self.failed.len() >= MAX_FAILED {
                    limits::reached(FAILED_REACHED);
                    self.failed.clear();
                }
                self.failed.insert(path);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn each_limit_reports_its_own_number() {
        for (max, what) in [
            (MAX_KEPT, KEPT_REACHED),
            (MAX_IN_FLIGHT, IN_FLIGHT_REACHED),
            (MAX_FAILED, FAILED_REACHED),
        ] {
            assert!(
                what.contains(&format!("({max})")),
                "{what:?} should say {max}"
            );
        }
    }

    #[test]
    fn keeps_the_newest_pages() {
        let mut p = Payloads::default();
        for i in 0..=MAX_KEPT {
            p.remember(format!("/p/{i}"), RoutePayload::Home);
        }
        assert!(p.get("/p/0").is_none());
        assert!(p.get("/p/1").is_some());
        assert!(p.get(&format!("/p/{MAX_KEPT}")).is_some());
    }
}
