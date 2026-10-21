//! Everything on the site, every kind together, newest first, as far as it has been fetched:
//! what the home spiral is lettered with. Pages come from /api/app/timeline.

use std::ops::RangeInclusive;
use std::time::Duration;

use gpui::Task;

use crate::api::{self, TimelineItem};

/// Entries per page of /api/app/timeline (the Worker's TIMELINE_PAGE).
const PAGE: u32 = 40;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Progress {
    /// no page has arrived, so how many there are isn't known
    Unknown,
    /// the pages before `next` have arrived, of `pages`
    Partial {
        next: u32,
        pages: u32,
    },
    Complete,
    /// fetches kept failing: the site stopped asking
    GaveUp,
}

pub struct Timeline {
    pub items: Vec<TimelineItem>,
    progress: Progress,
    /// fetches that failed in a row: each waits longer before the next
    tries: u32,
    /// how many entries the spiral in view asked for
    wanted: usize,
    /// a fetch in flight, or the wait before trying again (the view asks every frame meanwhile)
    pub task: Option<Task<()>>,
}

/// What a fetch brought.
pub struct Arrived {
    /// at least one page joined the timeline
    pub any: bool,
    /// a page failed
    pub failed: bool,
    /// how long to wait before asking again, after a failure
    pub retry: Option<Duration>,
}

impl Default for Timeline {
    fn default() -> Self {
        Self {
            items: Vec::new(),
            progress: Progress::Unknown,
            tries: 0,
            wanted: 0,
            task: None,
        }
    }
}

impl Timeline {
    /// The first page is still to come, and none has failed: the spiral waits for it.
    pub fn waiting(&self) -> bool {
        self.progress == Progress::Unknown && self.tries == 0
    }

    /// There are pages left to fetch.
    pub fn has_more(&self) -> bool {
        matches!(self.progress, Progress::Partial { .. })
    }

    /// The spiral in view would letter `n` entries.
    pub fn want(&mut self, n: usize) {
        self.wanted = n;
    }

    /// The pages to fetch now: the first alone (it says how many there are), then every page
    /// the view wants at once. `None` while a fetch or a wait is under way, or with none left.
    pub fn pages_to_fetch(&self) -> Option<RangeInclusive<u32>> {
        if self.task.is_some() {
            return None;
        }
        match self.progress {
            Progress::Unknown => Some(1..=1),
            Progress::Partial { next, pages } => {
                Some(next..=(self.wanted.div_ceil(PAGE as usize) as u32).clamp(next, pages))
            }
            Progress::Complete | Progress::GaveUp => None,
        }
    }

    fn next_page(&self) -> Option<u32> {
        match self.progress {
            Progress::Unknown => Some(1),
            Progress::Partial { next, .. } => Some(next),
            Progress::Complete | Progress::GaveUp => None,
        }
    }

    /// Take in a fetch's pages, in the order asked for.
    pub fn arrived(&mut self, got: Vec<anyhow::Result<api::Timeline>>) -> Arrived {
        let failed = got.iter().any(Result::is_err);
        let mut any = false;
        for t in got.into_iter().flatten() {
            // a page that failed leaves the ones after it for the next ask
            if Some(t.page) != self.next_page() {
                break;
            }
            self.items.extend(t.items);
            self.progress = if t.page >= t.pages {
                Progress::Complete
            } else {
                Progress::Partial {
                    next: t.page + 1,
                    pages: t.pages,
                }
            };
            any = true;
        }
        let retry = if failed {
            self.tries += 1;
            let wait = crate::http::Retry::PATIENT.wait(self.tries);
            if wait.is_none() {
                self.progress = Progress::GaveUp;
            }
            wait
        } else {
            self.tries = 0;
            None
        };
        Arrived { any, failed, retry }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(page: u32, pages: u32) -> anyhow::Result<api::Timeline> {
        let item = TimelineItem {
            title: format!("p{page}"),
            href: format!("/p/{page}"),
            kind: "posts".into(),
            at: "2024-01-01".into(),
        };
        Ok(api::Timeline {
            items: vec![item],
            page,
            pages,
            total: pages,
        })
    }

    #[test]
    fn fetches_the_first_page_then_what_the_view_wants() {
        let mut t = Timeline::default();
        assert!(t.waiting());
        assert_eq!(t.pages_to_fetch(), Some(1..=1));
        assert!(t.arrived(vec![page(1, 5)]).any);
        assert!(!t.waiting() && t.has_more());
        t.want(100);
        assert_eq!(t.pages_to_fetch(), Some(2..=3));
        t.arrived(vec![page(2, 5), Err(anyhow::anyhow!("503")), page(4, 5)]);
        assert_eq!(t.items.len(), 2, "page 4 waits for page 3");
        assert_eq!(t.pages_to_fetch(), Some(3..=3));
        t.arrived(vec![page(3, 5)]);
        t.want(1000);
        t.arrived(vec![page(4, 5), page(5, 5)]);
        assert_eq!(
            (t.items.len(), t.has_more(), t.pages_to_fetch()),
            (5, false, None)
        );
    }

    #[test]
    fn a_failing_timeline_stops_the_wait_then_the_asking() {
        let mut t = Timeline::default();
        let first = t.arrived(vec![Err(anyhow::anyhow!("503"))]);
        assert_eq!(
            (first.any, first.failed, first.retry),
            (false, true, Some(Duration::from_millis(800)))
        );
        assert!(!t.waiting(), "the index letters the spiral meanwhile");
        let waits: Vec<_> = (1..crate::http::Retry::PATIENT.tries)
            .map(|_| t.arrived(vec![Err(anyhow::anyhow!("503"))]).retry)
            .collect();
        assert_eq!(
            waits[..4],
            [1600, 3200, 6400, 12800].map(|ms| Some(Duration::from_millis(ms)))
        );
        assert_eq!(waits.last(), Some(&None));
        assert_eq!(t.pages_to_fetch(), None);
    }
}
