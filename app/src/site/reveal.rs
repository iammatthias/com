use web_time::Instant;

const FADE_SECS: f32 = 0.3;
const HOLD_SECS: f32 = 1.6;
const WATCH_SECS: f32 = 1.7;
const KEEP_LAST_ABOVE: f32 = 0.5;
const LEAVING_ABOVE: f32 = 0.01;
const LEAVE_FADE_FROM: f32 = 0.6;
const LEAVE_FADE_OVER: f32 = 0.4;

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum Reveal {
    #[default]
    Waiting,
    Opening {
        ready: Instant,
    },
    Showing {
        ready: Instant,
        content: Instant,
    },
}

#[derive(Clone, Copy)]
pub struct Page {
    pub ready: bool,
    pub has_content: bool,
    pub frame_open: bool,
    pub frame_progress: f32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Step {
    pub shown: f32,
    pub wants_frame: bool,
}

impl Reveal {
    pub fn reset(&mut self) {
        *self = Reveal::Waiting;
    }

    pub fn page(&mut self, now: Instant, page: Page) -> Step {
        let was_fading = match *self {
            Reveal::Showing { content, .. } => secs(content, now) < FADE_SECS,
            _ => false,
        };
        if !page.ready {
            *self = Reveal::Waiting;
            let keeping_last = page.has_content && page.frame_progress > KEEP_LAST_ABOVE;
            return Step {
                shown: if keeping_last { 1.0 } else { 0.0 },
                wants_frame: true,
            };
        }
        let (ready, content) = match *self {
            Reveal::Waiting => (now, None),
            Reveal::Opening { ready } => (ready, None),
            Reveal::Showing { ready, content } => (ready, Some(content)),
        };
        let ready_for = secs(ready, now);
        let content = content.or_else(|| (page.frame_open || ready_for > HOLD_SECS).then_some(now));
        *self = match content {
            Some(content) => Reveal::Showing { ready, content },
            None => Reveal::Opening { ready },
        };
        Step {
            shown: content.map_or(0.0, |since| (secs(since, now) / FADE_SECS).min(1.0)),
            wants_frame: was_fading || ready_for < WATCH_SECS,
        }
    }

    pub fn plain(ready: bool) -> Step {
        Step {
            shown: if ready { 1.0 } else { 0.0 },
            wants_frame: !ready,
        }
    }

    pub fn leaving(frame_progress: f32) -> Option<f32> {
        (frame_progress > LEAVING_ABOVE)
            .then(|| ((frame_progress - LEAVE_FADE_FROM) / LEAVE_FADE_OVER).clamp(0.0, 1.0))
    }
}

fn secs(from: Instant, to: Instant) -> f32 {
    to.duration_since(from).as_secs_f32()
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::*;

    const READY: Page = Page {
        ready: true,
        has_content: true,
        frame_open: false,
        frame_progress: 0.0,
    };
    const OPEN: Page = Page {
        frame_open: true,
        frame_progress: 1.0,
        ..READY
    };
    const LOADING: Page = Page {
        ready: false,
        ..READY
    };

    fn run(reveal: &mut Reveal, start: Instant, frames: &[(u64, Page)]) -> Vec<(u64, i32, bool)> {
        frames
            .iter()
            .map(|&(ms, page)| {
                let step = reveal.page(start + Duration::from_millis(ms), page);
                (ms, (step.shown * 100.0).round() as i32, step.wants_frame)
            })
            .collect()
    }

    #[test]
    fn the_text_fades_up_over_300ms_once_the_frame_has_opened() {
        let mut reveal = Reveal::default();
        let frames = [
            (0, READY),
            (450, READY),
            (900, OPEN),
            (1050, OPEN),
            (1250, OPEN),
            (1650, OPEN),
            (1750, OPEN),
        ];
        assert_eq!(
            run(&mut reveal, Instant::now(), &frames),
            [
                (0, 0, true),
                (450, 0, true),
                (900, 0, true),
                (1050, 50, true),
                (1250, 100, true),
                (1650, 100, true),
                (1750, 100, false),
            ]
        );
    }

    #[test]
    fn a_frame_that_never_opens_holds_the_text_back_for_1600ms() {
        let mut reveal = Reveal::default();
        let frames = [
            (0, READY),
            (1500, READY),
            (1650, READY),
            (1800, READY),
            (1900, READY),
            (2000, READY),
        ];
        assert_eq!(
            run(&mut reveal, Instant::now(), &frames),
            [
                (0, 0, true),
                (1500, 0, true),
                (1650, 0, true),
                (1800, 50, true),
                (1900, 83, true),
                (2000, 100, false),
            ]
        );
    }

    #[test]
    fn the_last_page_stays_up_while_the_next_loads_inside_an_open_frame() {
        let mut reveal = Reveal::default();
        let framed = Page {
            frame_progress: 0.8,
            ..LOADING
        };
        let unwinding = Page {
            frame_progress: 0.4,
            ..LOADING
        };
        let empty = Page {
            has_content: false,
            ..framed
        };
        assert_eq!(
            run(
                &mut reveal,
                Instant::now(),
                &[(0, framed), (16, unwinding), (32, empty)]
            ),
            [(0, 100, true), (16, 0, true), (32, 0, true)]
        );
    }

    #[test]
    fn a_page_on_its_way_starts_the_wait_and_the_fade_over() {
        let mut reveal = Reveal::default();
        let start = Instant::now();
        assert_eq!(
            run(&mut reveal, start, &[(0, OPEN), (400, OPEN)]),
            [(0, 0, true), (400, 100, true)]
        );
        let unframed = Page {
            frame_progress: 0.2,
            ..LOADING
        };
        assert_eq!(
            run(
                &mut reveal,
                start,
                &[(500, unframed), (3000, READY), (3100, OPEN), (3250, OPEN)]
            ),
            [
                (500, 0, true),
                (3000, 0, true),
                (3100, 0, true),
                (3250, 50, true)
            ]
        );
        reveal.reset();
        assert_eq!(run(&mut reveal, start, &[(9000, OPEN)]), [(9000, 0, true)]);
    }

    #[test]
    fn going_home_the_text_goes_in_the_first_stretch_of_the_unwind() {
        let percent = |progress| Reveal::leaving(progress).map(|s| (s * 100.0).round() as i32);
        assert_eq!(percent(1.0), Some(100));
        assert_eq!(percent(0.9), Some(75));
        assert_eq!(percent(0.5), Some(0));
        assert_eq!(percent(0.02), Some(0));
        assert_eq!(percent(0.005), None);
    }

    #[test]
    fn plain_paper_shows_a_page_the_moment_it_is_ready() {
        assert_eq!(
            Reveal::plain(true),
            Step {
                shown: 1.0,
                wants_frame: false
            }
        );
        assert_eq!(
            Reveal::plain(false),
            Step {
                shown: 0.0,
                wants_frame: true
            }
        );
    }
}
