//! How the plate comes up: rising in place from its first frame on screen, or drawn out of the
//! point where the intro's greeting fell, a pen running along the spiral with the plate rising
//! behind it.

use web_time::Instant;

/// seconds for the plate to come up out of the intro's bare spiral
const REVEAL_FOR: f32 = 2.6;
/// seconds for the pen to draw the line out from the spiral's start to past the corners
const DRAW_OUT: f32 = 3.6;

/// Seconds since `at`, stretched by the greeting's own `#slow=` (so the two can be looked at
/// as one motion).
fn since(at: Instant) -> f32 {
    thread_local! {
        static SLOW: f32 = crate::route::debug::number("slow").map_or(1.0, |f| f.max(0.05));
    }
    at.elapsed().as_secs_f32() / SLOW.with(|s| *s)
}

/// Seconds since the pen started (0 while it waits).
fn secs_since(pen: Option<Instant>) -> f32 {
    pen.map_or(0.0, since)
}

#[derive(Clone, Copy)]
enum Entrance {
    /// rising in place since `born`
    Rise { born: Instant },
    /// drawn out of a point by a pen that started at `pen` (None while the greeting still falls)
    Point { pen: Option<Instant> },
}

pub(super) struct Reveal {
    entrance: Entrance,
    /// drawn at least once
    shown: bool,
}

impl Reveal {
    pub fn new() -> Self {
        Self {
            entrance: Entrance::Rise {
                born: Instant::now(),
            },
            shown: false,
        }
    }

    /// The plate is on screen for the first time at `now` (it may be engraved ahead of time):
    /// it rises from here. True only the first time.
    pub fn first_draw(&mut self, now: Instant) -> bool {
        if self.shown {
            return false;
        }
        self.shown = true;
        if let Entrance::Rise { born } = &mut self.entrance {
            *born = now;
        }
        true
    }

    /// Draw the line out of a point instead of rising in place (a pen already running keeps on).
    pub fn emerge(&mut self) {
        if let Entrance::Rise { .. } = self.entrance {
            self.entrance = Entrance::Point { pen: None };
        }
    }

    pub fn start_pen(&mut self) {
        if let Entrance::Point { pen: pen @ None } = &mut self.entrance {
            *pen = Some(Instant::now());
        }
    }

    /// Blank under the greeting, the pen not yet started.
    pub fn waiting_for_pen(&self) -> bool {
        matches!(self.entrance, Entrance::Point { pen: None })
    }

    /// How far out the pen has drawn, eased 0..1: quickest out of the point, so the line is there
    /// the moment the greeting has wound into it, easing into the corners; None when there is no
    /// pen or it has finished.
    pub fn pen(&self) -> Option<f32> {
        let Entrance::Point { pen } = self.entrance else {
            return None;
        };
        let x = (secs_since(pen) / DRAW_OUT).clamp(0.0, 1.0);
        (x < 1.0).then(|| 1.0 - (1.0 - x) * (1.0 - x))
    }

    /// How far the plate has risen, eased 0..1.
    pub fn progress(&self) -> f32 {
        // drawn out of a point, the plate rises as the pen reaches the screen's edges (eased, it
        // covers the screen in the first quarter of its run)
        let t = match self.entrance {
            Entrance::Rise { born } => since(born),
            Entrance::Point { pen } => secs_since(pen) - DRAW_OUT * 0.22,
        };
        let x = (t / REVEAL_FOR).clamp(0.0, 1.0);
        x * x * (3.0 - 2.0 * x)
    }

    /// How present the controls should be: they arrive with the plate as it rises out of a
    /// point, and are simply there otherwise.
    pub fn chrome(&self) -> f32 {
        if let Entrance::Rise { .. } = self.entrance {
            return 1.0;
        }
        let x = ((self.progress() - 0.25) / 0.6).clamp(0.0, 1.0);
        x * x * (3.0 - 2.0 * x)
    }

    /// Still coming up.
    pub fn moving(&self) -> bool {
        !self.shown || self.progress() < 1.0 || self.pen().is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_pen_waits_for_the_greeting_then_draws() {
        let mut r = Reveal::new();
        assert!(r.first_draw(Instant::now()));
        assert!(!r.first_draw(Instant::now()));
        assert_eq!(r.pen(), None, "rising in place: no pen");
        assert_eq!(r.chrome(), 1.0);
        r.emerge();
        assert!(r.waiting_for_pen());
        assert_eq!(r.pen(), Some(0.0));
        assert_eq!(r.progress(), 0.0);
        assert_eq!(r.chrome(), 0.0);
        r.start_pen();
        assert!(!r.waiting_for_pen());
        r.emerge();
        assert!(!r.waiting_for_pen(), "emerging again keeps the running pen");
        assert!(r.moving());
    }
}
