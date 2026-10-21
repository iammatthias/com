//! Step mode for a recipe, ported from the old site's `recipe-interactive.ts`: pick a step (in
//! the grid or the method) and the grid dims to that step's cell and the rows it combines, a
//! stage above the grid reads the step out, Back/Next/Exit (and ←/→/Esc) move through them,
//! and a step with a duration gets a countdown with start/pause and reset.
//!
//! The clock only asks for redraws while it runs: a small task notifies the page a few times
//! a second and is dropped (cancelling it) when the clock stops.

use gpui::prelude::*;
use gpui::{AnyElement, App, ElementId, FocusHandle, KeyDownEvent, Window, div};

use crate::theme;
use gpui::px;

use super::recipe::{self, Recipe};
use super::recipe_view::RecipeState;
use super::render::{self, Ctx, alpha, label};
use super::state;

/// A countdown for the active step.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Clock {
    /// the step's full duration, seconds (0: the step has none)
    pub total: u32,
    /// seconds left when it last stopped
    pub left: f32,
    /// running since
    pub since: Option<web_time::Instant>,
}

impl Clock {
    pub fn for_secs(total: Option<u32>) -> Self {
        let total = total.unwrap_or(0);
        Self {
            total,
            left: total as f32,
            since: None,
        }
    }

    pub fn remaining(&self) -> f32 {
        match self.since {
            Some(t) => self.left - t.elapsed().as_secs_f32(),
            None => self.left,
        }
    }

    pub fn running(&self) -> bool {
        self.since.is_some() && self.remaining() > 0.
    }

    pub fn rang(&self) -> bool {
        self.since.is_some() && self.remaining() <= 0.
    }
}

/// `m:ss`, or `h:mm:ss` past the hour, rounding up so a fresh minute reads whole.
pub fn fmt_clock(secs: f32) -> String {
    let n = secs.max(0.).ceil() as u32;
    let (h, m, s) = (n / 3600, n / 60 % 60, n % 60);
    if h > 0 {
        format!("{h}:{m:02}:{s:02}")
    } else {
        format!("{m}:{s:02}")
    }
}

fn focus_key(state: &ElementId) -> String {
    format!("{state}:focus")
}

fn tick_key(state: &ElementId) -> String {
    format!("{state}:tick")
}

/// The recipe's focus handle: step mode listens for its keys there.
pub fn focus_handle(state: &ElementId, cx: &mut App) -> FocusHandle {
    let key = focus_key(state);
    if let Some(h) = state::slot(&key, || None::<FocusHandle>, |h| h.clone()) {
        return h;
    }
    let h = cx.focus_handle();
    state::slot(&key, || None::<FocusHandle>, |slot| *slot = Some(h.clone()));
    h
}

/// Move to step `i` (clamped), or out of step mode with `None`. The clock re-arms for the new step.
pub fn go(st: &ElementId, rec: &Recipe, i: Option<usize>, window: &mut Window, cx: &mut App) {
    let n = rec.steps.len();
    let i = i.map(|i| i.min(n.saturating_sub(1)));
    state::clear_slot(&tick_key(st));
    state::update::<RecipeState>(st, window, |s| {
        s.active = i;
        s.clock = Clock::for_secs(
            i.and_then(|i| rec.steps[i].duration.as_deref())
                .and_then(recipe::duration_secs),
        );
    });
    if i.is_some() {
        let h = focus_handle(st, cx);
        window.focus(&h, cx);
    }
}

/// Click on a step: into step mode there, or out if it is already the one shown.
pub fn pick(st: &ElementId, rec: &Recipe, i: usize, window: &mut Window, cx: &mut App) {
    let active = state::get::<RecipeState>(st).active;
    go(
        st,
        rec,
        if active == Some(i) { None } else { Some(i) },
        window,
        cx,
    );
}

fn start_pause(st: &ElementId, window: &mut Window, cx: &mut App) {
    let mut running = false;
    state::update::<RecipeState>(st, window, |s| {
        let c = &mut s.clock;
        if c.rang() {
            // rung out: the next press starts it again from the top
            *c = Clock::for_secs(Some(c.total));
        }
        match c.since.take() {
            Some(t) => c.left = (c.left - t.elapsed().as_secs_f32()).max(0.),
            None => {
                c.since = Some(web_time::Instant::now());
                running = true;
            }
        }
    });
    if running {
        let st2 = st.clone();
        let route = crate::route::current();
        let task = cx.spawn(async move |cx| {
            loop {
                // wake as the face next changes: just past the next whole second left
                let left = state::get::<RecipeState>(&st2).clock.remaining().max(0.);
                let wait = (left.fract() + 0.02).clamp(0.02, 1.02);
                cx.background_executor()
                    .timer(std::time::Duration::from_secs_f32(wait))
                    .await;
                // the reader went elsewhere: the page this would redraw isn't the recipe any more
                if crate::route::current() != route {
                    break;
                }
                let clock = state::get::<RecipeState>(&st2).clock;
                cx.update(|cx| state::redraw_page(cx));
                if !clock.running() {
                    break;
                }
            }
        });
        state::slot(
            &tick_key(st),
            || None::<gpui::Task<()>>,
            |slot| *slot = Some(task),
        );
    } else {
        state::clear_slot(&tick_key(st));
    }
}

fn reset(st: &ElementId, window: &mut Window) {
    state::clear_slot(&tick_key(st));
    state::update::<RecipeState>(st, window, |s| {
        s.clock = Clock::for_secs(Some(s.clock.total))
    });
}

/// ←/→ step, Esc leaves. Attached to the recipe's root, which holds focus in step mode.
pub fn keys(
    st: &ElementId,
    rec: &Recipe,
) -> impl Fn(&KeyDownEvent, &mut Window, &mut App) + 'static {
    let st = st.clone();
    let rec = rec.clone();
    move |e, window, cx| {
        let Some(i) = state::get::<RecipeState>(&st).active else {
            return;
        };
        match e.keystroke.key.as_str() {
            "left" => go(&st, &rec, Some(i.saturating_sub(1)), window, cx),
            "right" => go(&st, &rec, Some(i + 1), window, cx),
            "escape" => go(&st, &rec, None, window, cx),
            _ => return,
        }
        cx.stop_propagation();
    }
}

fn control(id: ElementId, text: &str, ctx: &Ctx) -> gpui::Stateful<gpui::Div> {
    let accent = ctx.theme.accent;
    div()
        .id(id)
        .cursor_pointer()
        .px(px(6.))
        .font_family(theme::SANS)
        .text_size(px(15.))
        .letter_spacing(px(0.8))
        .text_color(ctx.theme.ink)
        .hover(move |s| s.text_color(accent))
        .child(text.to_string())
}

/// The stage above the grid while a step is shown.
pub fn stage(
    st: &ElementId,
    rec: &Recipe,
    details: &[super::md::Rich],
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> Option<AnyElement> {
    let s = state::get::<RecipeState>(st);
    let i = s.active?;
    let step = rec.steps.get(i)?;
    let theme = ctx.theme;
    let n = rec.steps.len();
    let clock = s.clock.clone();

    let nav = |tag: &str, text: &str, to: Option<usize>| {
        let (st, rec) = (st.clone(), rec.clone());
        control(ctx.id(tag), text, ctx).on_click(move |_, window, cx| go(&st, &rec, to, window, cx))
    };
    let mut head = div()
        .flex()
        .flex_wrap()
        .items_baseline()
        .gap_x(px(12.))
        .gap_y(px(4.))
        .child(label(format!("STEP {} OF {n}", i + 1), theme.accent))
        .child(
            div()
                .flex_1()
                .min_w(px(120.))
                .italic()
                .text_size(px(19.))
                .child(step.action.clone()),
        );
    let mut nav_row = div().flex().items_baseline().gap(px(2.));
    if i > 0 {
        nav_row = nav_row.child(nav("rs-back", "← Back", Some(i - 1)));
    }
    if i + 1 < n {
        nav_row = nav_row.child(nav("rs-next", "Next →", Some(i + 1)));
    }
    nav_row = nav_row.child(nav("rs-exit", "Exit", None));
    head = head.child(nav_row);

    let mut panel = div()
        .p(px(12.))
        .border_1()
        .border_color(alpha(theme.accent, 0.6))
        .bg(alpha(theme.accent, 0.04))
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(head)
        .child(ctx.with_width(ctx.width - 26., |c| {
            div()
                .text_size(px(17.))
                .line_height(px(26.))
                .child(render::rich(&details[i], c, window, cx))
        }));

    if clock.total > 0 {
        let left = clock.remaining();
        let face = if clock.rang() {
            "time!".to_string()
        } else {
            fmt_clock(left)
        };
        let (st_a, st_b) = (st.clone(), st.clone());
        let rang = clock.rang();
        panel = panel.child(
            div()
                .flex()
                .items_center()
                .gap(px(10.))
                .child(label("TIMER", theme.muted))
                .child(
                    div()
                        .font_family(theme::MONO)
                        .text_size(px(20.))
                        .line_height(px(26.))
                        .text_color(if rang { theme.accent } else { theme.ink })
                        .when(rang, |d| d.border_b_1().border_color(theme.accent))
                        .child(face),
                )
                .child(
                    control(
                        ctx.id("rs-clock"),
                        if clock.running() {
                            "Pause"
                        } else if rang {
                            "Again"
                        } else {
                            "Start →"
                        },
                        ctx,
                    )
                    .on_click(move |_, window, cx| start_pause(&st_a, window, cx)),
                )
                .when(
                    clock.since.is_some() || clock.left < clock.total as f32,
                    |d| {
                        d.child(
                            control(ctx.id("rs-reset"), "Reset", ctx)
                                .on_click(move |_, window, _| reset(&st_b, window)),
                        )
                    },
                ),
        );
    }
    Some(panel.into_any_element())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clock_faces() {
        assert_eq!(fmt_clock(600.), "10:00");
        assert_eq!(fmt_clock(59.2), "1:00");
        assert_eq!(fmt_clock(3725.), "1:02:05");
        assert_eq!(fmt_clock(-3.), "0:00");
        let c = Clock::for_secs(Some(90));
        assert_eq!(c.remaining(), 90.);
        assert!(!c.running() && !c.rang());
    }
}
