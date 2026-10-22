//! The one state machine. A pure reducer: the gpui shell turns events into `Input`, calls
//! `step`, and applies the `Effects`. Nothing here calls out, so a step can never re-enter.

use gpui::{MouseButton, Pixels, Point, TouchPhase, px};

use super::model::{Granularity, Ordinal, Origin, Pos, Span};
use super::registry::Hit;

/// How far a press may travel and still be a click.
const SLOP: Pixels = px(4.);

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum End {
    Start,
    End,
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Gesture {
    Idle,
    /// The left button is down on text. A move past the slop turns it into a drag.
    Pressed {
        at: Point<Pixels>,
        hit: Hit,
        dragging: bool,
    },
    /// A claimed long press: the finger extends the word selection until it lifts.
    LongPressing,
    /// A finger on a handle, moving that end of the selection.
    Handle(End),
}

#[derive(Debug)]
pub enum Input {
    Down {
        at: Point<Pixels>,
        button: MouseButton,
        clicks: usize,
        shift: bool,
        /// where the press landed, if on a block that nothing covers
        hit: Option<Hit>,
    },
    Move {
        at: Point<Pixels>,
        /// the block nearest the pointer (None only with an empty document)
        hit: Option<Hit>,
    },
    Up {
        hit: Option<Hit>,
    },
    LongPress {
        phase: TouchPhase,
        hit: Option<Hit>,
    },
    HandleDrag {
        phase: TouchPhase,
        /// the handle under the finger when the drag started
        end: Option<End>,
        hit: Option<Hit>,
    },
    Copy,
    SelectAll {
        whole: Option<(Pos, Pos)>,
    },
}

#[derive(Default, Debug, PartialEq, Eq)]
pub struct Effects {
    /// the painted selection differs: notify the views that paint it
    pub changed: bool,
    /// `window.prevent_default()`: claim the long press or touch drag being offered
    pub claim: bool,
    /// `cx.stop_propagation()`: the keystroke was ours
    pub consume: bool,
    /// write the selection to the clipboard
    pub copy: bool,
    /// a click (not a drag) released on this link: follow it
    pub link: Option<(Ordinal, usize)>,
}

fn visible(sel: &Option<Span>) -> Option<((Pos, Pos), Origin)> {
    sel.as_ref()
        .filter(|s| !s.is_empty())
        .map(|s| (s.span(), s.origin))
}

pub fn step(gesture: &mut Gesture, sel: &mut Option<Span>, input: Input) -> Effects {
    let before = visible(sel);
    let mut fx = Effects::default();
    match input {
        Input::Down {
            button: MouseButton::Left,
            at,
            clicks,
            shift,
            hit,
        } => match hit {
            None => {
                *sel = None;
                *gesture = Gesture::Idle;
            }
            Some(hit) => {
                let extend = shift && sel.is_some();
                let dragging = match (extend, clicks) {
                    (true, _) => {
                        let s = sel.as_mut().unwrap();
                        s.focus = hit.group(s.granularity);
                        true
                    }
                    (false, 1) => {
                        *sel = None;
                        false
                    }
                    (false, 2) => {
                        *sel = Some(Span::new(hit.word, Granularity::Word, Origin::Pointer));
                        true
                    }
                    (false, _) => {
                        *sel = Some(Span::new(hit.block, Granularity::Block, Origin::Pointer));
                        true
                    }
                };
                *gesture = Gesture::Pressed { at, hit, dragging };
            }
        },
        Input::Down { .. } => {}
        Input::Move { at, hit: Some(hit) } => match gesture {
            Gesture::Pressed {
                at: from,
                hit: down,
                dragging,
            } => {
                if !*dragging {
                    if (at.x - from.x).abs() <= SLOP && (at.y - from.y).abs() <= SLOP {
                        return fx;
                    }
                    *dragging = true;
                    *sel = Some(Span::new(
                        (down.pos, down.pos),
                        Granularity::Char,
                        Origin::Pointer,
                    ));
                }
                if let Some(s) = sel.as_mut() {
                    s.focus = hit.group(s.granularity);
                }
            }
            Gesture::Handle(_) => {
                if let Some(s) = sel.as_mut() {
                    s.focus = (hit.pos, hit.pos);
                }
            }
            _ => {}
        },
        Input::Move { .. } => {}
        Input::Up { hit } => {
            if let Gesture::Pressed {
                hit: down,
                dragging: false,
                ..
            } = gesture
                && let (Some(l), Some(up)) = (down.link, hit)
                && up.pos.block == down.pos.block
                && up.link == Some(l)
            {
                fx.link = Some((down.pos.block, l));
            }
            *gesture = Gesture::Idle;
        }
        Input::LongPress { phase, hit } => match (phase, hit) {
            (TouchPhase::Started, Some(hit)) => {
                *sel = Some(Span::new(hit.word, Granularity::Word, Origin::Touch));
                *gesture = Gesture::LongPressing;
                fx.claim = true;
            }
            (TouchPhase::Started, None) => {}
            (TouchPhase::Moved, Some(hit)) => {
                if let (Gesture::LongPressing, Some(s)) = (&*gesture, sel.as_mut()) {
                    s.focus = hit.word;
                }
            }
            (TouchPhase::Moved, None) => {}
            (TouchPhase::Ended, _) => *gesture = Gesture::Idle,
            (TouchPhase::Cancelled, _) => {
                *sel = None;
                *gesture = Gesture::Idle;
            }
        },
        Input::HandleDrag { phase, end, hit } => match phase {
            TouchPhase::Started => {
                if let (Some(end), Some(s)) = (end, sel.as_mut()) {
                    // from here the ends move one character at a time, whichever way they cross
                    let (start, stop) = s.span();
                    let (fixed, moving) = match end {
                        End::Start => (stop, start),
                        End::End => (start, stop),
                    };
                    *s = Span {
                        anchor: (fixed, fixed),
                        focus: (moving, moving),
                        granularity: Granularity::Char,
                        origin: Origin::Touch,
                    };
                    *gesture = Gesture::Handle(end);
                    fx.claim = true;
                }
            }
            TouchPhase::Moved => {
                if let (Gesture::Handle(_), Some(s), Some(hit)) = (&*gesture, sel.as_mut(), hit) {
                    s.focus = (hit.pos, hit.pos);
                }
            }
            TouchPhase::Ended | TouchPhase::Cancelled => {
                if matches!(gesture, Gesture::Handle(_)) {
                    *gesture = Gesture::Idle;
                }
            }
        },
        Input::Copy => {
            if visible(sel).is_some() {
                fx.copy = true;
                fx.consume = true;
            }
        }
        Input::SelectAll { whole } => {
            if let Some(whole) = whole {
                *sel = Some(Span::new(whole, Granularity::Block, Origin::Pointer));
                fx.consume = true;
            }
        }
    }
    // an empty selection left behind by a settled gesture is no selection
    if *gesture == Gesture::Idle && sel.is_some_and(|s| s.is_empty()) {
        *sel = None;
    }
    fx.changed = visible(sel) != before;
    fx
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui::point;

    fn p(block: u32, byte: usize) -> Pos {
        Pos::new(Ordinal(block), byte)
    }

    fn hit(block: u32, byte: usize, word: (usize, usize), link: Option<usize>) -> Hit {
        Hit {
            pos: p(block, byte),
            word: (p(block, word.0), p(block, word.1)),
            block: (p(block, 0), p(block, 20)),
            link,
        }
    }

    fn at(x: f32) -> Point<Pixels> {
        point(px(x), px(50.))
    }

    fn down(x: f32, clicks: usize, shift: bool, h: Option<Hit>) -> Input {
        Input::Down {
            at: at(x),
            button: MouseButton::Left,
            clicks,
            shift,
            hit: h,
        }
    }

    fn mv(x: f32, h: Hit) -> Input {
        Input::Move {
            at: at(x),
            hit: Some(h),
        }
    }

    #[test]
    fn a_drag_selects_between_the_press_and_the_pointer_across_blocks() {
        let (mut g, mut s) = (Gesture::Idle, None);
        let fx = step(
            &mut g,
            &mut s,
            down(10., 1, false, Some(hit(0, 3, (0, 5), None))),
        );
        assert_eq!(fx, Effects::default());
        // within the slop: still a click
        assert!(!step(&mut g, &mut s, mv(12., hit(0, 4, (0, 5), None))).changed);
        assert_eq!(s, None);
        let fx = step(&mut g, &mut s, mv(60., hit(1, 7, (6, 9), None)));
        assert!(fx.changed);
        assert_eq!(s.unwrap().span(), (p(0, 3), p(1, 7)));
        // dragging back before the press reverses the ends
        step(&mut g, &mut s, mv(0., hit(0, 1, (0, 5), None)));
        assert_eq!(s.unwrap().span(), (p(0, 1), p(0, 3)));
        let fx = step(&mut g, &mut s, Input::Up { hit: None });
        assert_eq!(fx.link, None);
        assert_eq!(g, Gesture::Idle);
        assert_eq!(s.unwrap().span(), (p(0, 1), p(0, 3)));
    }

    #[test]
    fn clicks_select_a_word_then_a_block_and_shift_extends() {
        let (mut g, mut s) = (Gesture::Idle, None);
        let fx = step(
            &mut g,
            &mut s,
            down(10., 2, false, Some(hit(0, 3, (0, 5), None))),
        );
        assert!(fx.changed);
        assert_eq!(s.unwrap().span(), (p(0, 0), p(0, 5)));
        // dragging a word selection grows by whole words
        step(&mut g, &mut s, mv(90., hit(0, 12, (10, 15), None)));
        assert_eq!(s.unwrap().span(), (p(0, 0), p(0, 15)));
        step(&mut g, &mut s, Input::Up { hit: None });
        step(
            &mut g,
            &mut s,
            down(10., 3, false, Some(hit(1, 3, (0, 5), None))),
        );
        assert_eq!(s.unwrap().span(), (p(1, 0), p(1, 20)));
        step(&mut g, &mut s, Input::Up { hit: None });
        let fx = step(
            &mut g,
            &mut s,
            down(300., 1, true, Some(hit(3, 4, (2, 6), None))),
        );
        assert!(fx.changed);
        assert_eq!(s.unwrap().span(), (p(1, 0), p(3, 20)));
    }

    #[test]
    fn a_click_clears_and_a_click_on_a_link_follows_it_unless_it_dragged() {
        let (mut g, mut s) = (Gesture::Idle, None);
        step(
            &mut g,
            &mut s,
            down(10., 2, false, Some(hit(0, 3, (0, 5), None))),
        );
        step(&mut g, &mut s, Input::Up { hit: None });
        assert!(s.is_some());
        let fx = step(&mut g, &mut s, down(500., 1, false, None));
        assert!(fx.changed);
        assert_eq!(s, None);
        let link = hit(2, 4, (2, 8), Some(0));
        step(&mut g, &mut s, down(10., 1, false, Some(link)));
        let fx = step(&mut g, &mut s, Input::Up { hit: Some(link) });
        assert_eq!(fx.link, Some((Ordinal(2), 0)));
        step(&mut g, &mut s, down(10., 1, false, Some(link)));
        step(&mut g, &mut s, mv(80., hit(2, 9, (8, 12), None)));
        let fx = step(&mut g, &mut s, Input::Up { hit: Some(link) });
        assert_eq!(fx.link, None);
        assert_eq!(s.unwrap().span(), (p(2, 4), p(2, 9)));
    }

    #[test]
    fn a_long_press_claims_a_word_and_handles_move_one_end() {
        let (mut g, mut s) = (Gesture::Idle, None);
        let fx = step(
            &mut g,
            &mut s,
            Input::LongPress {
                phase: TouchPhase::Started,
                hit: None,
            },
        );
        assert_eq!(fx, Effects::default());
        let fx = step(
            &mut g,
            &mut s,
            Input::LongPress {
                phase: TouchPhase::Started,
                hit: Some(hit(1, 3, (0, 5), None)),
            },
        );
        assert!(fx.claim && fx.changed);
        assert_eq!(s.unwrap().origin, Origin::Touch);
        step(
            &mut g,
            &mut s,
            Input::LongPress {
                phase: TouchPhase::Moved,
                hit: Some(hit(1, 12, (10, 15), None)),
            },
        );
        assert_eq!(s.unwrap().span(), (p(1, 0), p(1, 15)));
        step(
            &mut g,
            &mut s,
            Input::LongPress {
                phase: TouchPhase::Ended,
                hit: None,
            },
        );
        assert_eq!(g, Gesture::Idle);
        // a drag not on a handle is not claimed, so the page still pans
        let fx = step(
            &mut g,
            &mut s,
            Input::HandleDrag {
                phase: TouchPhase::Started,
                end: None,
                hit: None,
            },
        );
        assert!(!fx.claim);
        let fx = step(
            &mut g,
            &mut s,
            Input::HandleDrag {
                phase: TouchPhase::Started,
                end: Some(End::Start),
                hit: None,
            },
        );
        assert!(fx.claim);
        step(
            &mut g,
            &mut s,
            Input::HandleDrag {
                phase: TouchPhase::Moved,
                end: None,
                hit: Some(hit(0, 7, (5, 9), None)),
            },
        );
        assert_eq!(s.unwrap().span(), (p(0, 7), p(1, 15)));
        // crossing the other end swaps them
        step(
            &mut g,
            &mut s,
            Input::HandleDrag {
                phase: TouchPhase::Moved,
                end: None,
                hit: Some(hit(1, 18, (16, 20), None)),
            },
        );
        assert_eq!(s.unwrap().span(), (p(1, 15), p(1, 18)));
        step(
            &mut g,
            &mut s,
            Input::HandleDrag {
                phase: TouchPhase::Ended,
                end: None,
                hit: None,
            },
        );
        assert_eq!(g, Gesture::Idle);
        assert_eq!(s.unwrap().origin, Origin::Touch);
    }

    #[test]
    fn keys_copy_only_a_selection_and_select_all_takes_the_document() {
        let (mut g, mut s) = (Gesture::Idle, None);
        assert_eq!(step(&mut g, &mut s, Input::Copy), Effects::default());
        assert_eq!(
            step(&mut g, &mut s, Input::SelectAll { whole: None }),
            Effects::default()
        );
        let fx = step(
            &mut g,
            &mut s,
            Input::SelectAll {
                whole: Some((p(0, 0), p(9, 4))),
            },
        );
        assert!(fx.consume && fx.changed);
        assert_eq!(s.unwrap().span(), (p(0, 0), p(9, 4)));
        let fx = step(&mut g, &mut s, Input::Copy);
        assert!(fx.copy && fx.consume && !fx.changed);
    }
}
