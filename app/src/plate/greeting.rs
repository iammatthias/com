#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Greeted {
    Resting,
    Done,
}

pub(super) enum Greeting<G> {
    Never,
    Writing(G),
    Resting(G),
    Done,
}

#[derive(Clone, Copy)]
pub(super) struct Moment {
    pub resting: bool,
    pub done: bool,
}

impl<G> Greeting<G> {
    pub fn begin(&mut self, greeting: G) {
        *self = Greeting::Writing(greeting);
    }

    pub fn active(&self) -> Option<&G> {
        match self {
            Greeting::Writing(greeting) | Greeting::Resting(greeting) => Some(greeting),
            Greeting::Never | Greeting::Done => None,
        }
    }

    pub fn active_mut(&mut self) -> Option<&mut G> {
        match self {
            Greeting::Writing(greeting) | Greeting::Resting(greeting) => Some(greeting),
            Greeting::Never | Greeting::Done => None,
        }
    }

    pub fn being_written(&self) -> bool {
        matches!(self, Greeting::Writing(_))
    }

    pub fn happened(&self) -> bool {
        !matches!(self, Greeting::Never)
    }

    pub fn follow(&mut self, moment: Moment) -> [Option<Greeted>; 2] {
        let mut told = [None, None];
        if moment.resting && self.being_written() {
            if let Greeting::Writing(greeting) = std::mem::replace(self, Greeting::Done) {
                *self = Greeting::Resting(greeting);
            }
            told[0] = Some(Greeted::Resting);
        }
        if moment.done {
            told[1] = self.end();
        }
        told
    }

    pub fn end(&mut self) -> Option<Greeted> {
        self.active()?;
        *self = Greeting::Done;
        Some(Greeted::Done)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const WRITING: Moment = Moment {
        resting: false,
        done: false,
    };
    const WRITTEN: Moment = Moment {
        resting: true,
        done: false,
    };
    const FALLEN: Moment = Moment {
        resting: true,
        done: true,
    };

    #[test]
    fn the_site_is_told_once_when_it_rests_and_once_when_it_is_gone() {
        let mut greeting = Greeting::Never;
        assert!(!greeting.happened());
        greeting.begin("hello");
        assert_eq!(greeting.follow(WRITING), [None, None]);
        assert!(greeting.being_written());
        assert_eq!(greeting.follow(WRITTEN), [Some(Greeted::Resting), None]);
        assert!(!greeting.being_written());
        assert_eq!(greeting.active(), Some(&"hello"));
        assert_eq!(greeting.follow(WRITTEN), [None, None]);
        assert_eq!(greeting.follow(FALLEN), [None, Some(Greeted::Done)]);
        assert_eq!(greeting.active(), None);
        assert!(greeting.happened());
        assert_eq!(greeting.follow(FALLEN), [None, None]);
    }

    #[test]
    fn a_frame_long_enough_to_span_the_rest_tells_both_in_order() {
        let mut greeting = Greeting::Never;
        greeting.begin("hello");
        assert_eq!(
            greeting.follow(FALLEN),
            [Some(Greeted::Resting), Some(Greeted::Done)]
        );
    }

    #[test]
    fn ending_it_early_tells_only_that_it_is_gone() {
        let mut greeting = Greeting::Never;
        assert_eq!(greeting.end(), None);
        assert!(!greeting.happened());
        greeting.begin("hello");
        assert_eq!(greeting.end(), Some(Greeted::Done));
        assert_eq!(greeting.end(), None);
        assert!(greeting.happened() && !greeting.being_written());
        assert_eq!(greeting.follow(FALLEN), [None, None]);
    }
}
