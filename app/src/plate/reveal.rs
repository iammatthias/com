use web_time::Instant;

const REVEAL_FOR: f32 = 2.6;
const DRAW_OUT: f32 = 3.6;

fn since(at: Instant) -> f32 {
    at.elapsed().as_secs_f32() / crate::browser::debug::slow()
}

fn secs_since(pen: Option<Instant>) -> f32 {
    pen.map_or(0.0, since)
}

#[derive(Clone, Copy)]
enum Entrance {
    Rise { born: Instant },
    Point { pen: Option<Instant> },
}

pub(super) struct Reveal {
    entrance: Entrance,
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

    pub fn waiting_for_pen(&self) -> bool {
        matches!(self.entrance, Entrance::Point { pen: None })
    }

    pub fn pen(&self) -> Option<f32> {
        let Entrance::Point { pen } = self.entrance else {
            return None;
        };
        let x = (secs_since(pen) / DRAW_OUT).clamp(0.0, 1.0);
        (x < 1.0).then(|| 1.0 - (1.0 - x) * (1.0 - x))
    }

    pub fn progress(&self) -> f32 {
        let t = match self.entrance {
            Entrance::Rise { born } => since(born),
            Entrance::Point { pen } => secs_since(pen) - DRAW_OUT * 0.22,
        };
        let x = (t / REVEAL_FOR).clamp(0.0, 1.0);
        x * x * (3.0 - 2.0 * x)
    }

    pub fn chrome(&self) -> f32 {
        if let Entrance::Rise { .. } = self.entrance {
            return 1.0;
        }
        let x = ((self.progress() - 0.25) / 0.6).clamp(0.0, 1.0);
        x * x * (3.0 - 2.0 * x)
    }

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
