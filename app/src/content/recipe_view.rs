//! The recipe grid: ingredients down the left, each step a merged cell to the right of
//! everything it combines, read left to right toward the finished dish. Serves ×½/×1/×2
//! rescales amounts; clicking an ingredient strikes it off.

use std::collections::HashSet;

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, ElementId, Window, div};

use crate::theme;

use super::recipe::{self, Grid, Recipe, RecipeBlock};
use super::recipe_steps;
use super::render::{self, Ctx, alpha, hairline, label};
use super::state;

/// `factor` 0 means unset (×1).
#[derive(Clone, Default, PartialEq)]
pub struct RecipeState {
    factor: f64,
    struck: HashSet<usize>,
    /// the step shown in step mode
    pub active: Option<usize>,
    pub clock: super::recipe_steps::Clock,
}

const FACTORS: [f64; 3] = [0.5, 1., 2.];

pub fn view(block: &RecipeBlock, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    let (recipe, grids, serves, notes, details, ingredient_notes) = match block {
        RecipeBlock::Ok {
            recipe,
            grids,
            serves,
            notes,
            details,
            ingredient_notes,
        } => (recipe, grids, *serves, notes, details, ingredient_notes),
        RecipeBlock::Err { message, source } => {
            return div()
                .flex()
                .flex_col()
                .gap(px(8.))
                .child(render::muted_note(message, ctx))
                .child(render::block(
                    &super::md::Block::Code {
                        lang: "recipe".into(),
                        code: source.clone(),
                    },
                    ctx,
                    window,
                    cx,
                ))
                .into_any_element();
        }
    };
    let state: ElementId = ctx.id("recipe");
    let (factor, struck, active) = {
        let s = state::get::<RecipeState>(&state);
        (
            if s.factor == 0. { 1. } else { s.factor },
            s.struck,
            s.active,
        )
    };
    let scalable = serves > 0
        && recipe.ingredients.iter().any(|i| {
            i.amount
                .as_deref()
                .is_some_and(|a| recipe::scale_amount(a, 1.).is_some())
        });

    let focus = recipe_steps::focus_handle(&state, cx);
    let mut col = div()
        .track_focus(&focus)
        .on_key_down(recipe_steps::keys(&state, recipe))
        .flex()
        .flex_col()
        .gap(px(18.));

    // yield · time · serves
    let mut meta = div()
        .flex()
        .flex_wrap()
        .items_baseline()
        .gap_x(px(28.))
        .gap_y(px(6.));
    if let Some(y) = recipe.yields.as_deref() {
        let y = if factor == 1. {
            y.to_string()
        } else {
            recipe::scale_yield(y, factor)
        };
        meta = meta.child(meta_pair("Yield", y, ctx));
    }
    if let Some(t) = recipe.time.as_deref() {
        meta = meta.child(meta_pair("Time", t.to_string(), ctx));
    }
    if scalable {
        meta = meta.child(serves_toggle(serves, factor, &state, ctx));
    }
    if grids.is_some() && active.is_none() {
        let (st, rec) = (state.clone(), recipe.clone());
        let accent = theme.accent;
        meta = meta.child(
            div()
                .id(ctx.id("stepmode"))
                .cursor_pointer()
                .italic()
                .text_size(px(17.))
                .text_color(theme.accent)
                .hover(move |s| s.text_color(alpha(accent, 0.7)))
                .child("Cook step by step →")
                .on_click(move |_, window, cx| recipe_steps::go(&st, &rec, Some(0), window, cx)),
        );
    }
    col = col.child(meta);

    match grids {
        Some(grids) => {
            if let Some(stage) = recipe_steps::stage(&state, recipe, details, ctx, window, cx) {
                col = col.child(stage);
            }
            for g in grids {
                col = col.child(grid(
                    g,
                    recipe,
                    ingredient_notes,
                    factor,
                    &struck,
                    active,
                    &state,
                    ctx,
                    window,
                    cx,
                ));
            }
        }
        None => col = col.child(ingredient_list(recipe, factor, &struck, &state, ctx)),
    }

    col = col.child(method(recipe, details, active, &state, ctx, window, cx));
    if let Some(n) = notes {
        col = col.child(
            div()
                .italic()
                .text_size(px(17.))
                .line_height(px(27.))
                .text_color(theme.muted)
                .child(render::rich(n, ctx, window, cx)),
        );
    }
    if let Some(label_text) = recipe.source.as_deref().or(recipe.source_url.as_deref()) {
        let el = div()
            .flex()
            .gap(px(8.))
            .items_baseline()
            .text_size(px(15.))
            .text_color(theme.muted)
            .child("Source:");
        let el = match recipe.source_url.as_deref() {
            Some(url) => el.child(super::link(ctx.id("src"), label_text, url, ctx.nav, theme)),
            None => el.child(label_text.to_string()),
        };
        col = col.child(el);
    }
    col.into_any_element()
}

fn meta_pair(k: &str, v: String, ctx: &Ctx) -> AnyElement {
    div()
        .flex()
        .items_center()
        .gap(px(8.))
        .child(label(k.to_uppercase(), ctx.theme.accent))
        .child(
            div()
                .italic()
                .text_size(px(17.))
                .line_height(px(22.))
                .child(v),
        )
        .into_any_element()
}

fn serves_toggle(serves: u32, factor: f64, state: &ElementId, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    let mut row = div()
        .flex()
        .items_center()
        .gap(px(10.))
        .child(label("SERVES", theme.accent));
    for f in FACTORS {
        let on = (f - factor).abs() < 1e-9;
        let state = state.clone();
        let accent = theme.accent;
        row = row.child(
            div()
                .id(ctx.id("serves"))
                .cursor_pointer()
                .px(px(4.))
                .text_size(px(17.))
                .text_color(if on { theme.ink } else { theme.muted })
                .when(on, |d| d.border_b_1().border_color(theme.accent))
                .hover(move |s| s.text_color(accent))
                .child(recipe::serves_label(serves, f))
                .on_click(move |_, window, _| {
                    state::update::<RecipeState>(&state, window, |s| s.factor = f)
                }),
        );
    }
    row.into_any_element()
}

fn amount(a: Option<&str>, factor: f64) -> Option<String> {
    let a = a?;
    Some(if factor == 1. {
        a.to_string()
    } else {
        recipe::scale_amount(a, factor).unwrap_or_else(|| a.to_string())
    })
}

fn toggle_struck(state: &ElementId, i: usize, window: &mut Window) {
    state::update::<RecipeState>(state, window, |s| {
        if !s.struck.remove(&i) {
            s.struck.insert(i);
        }
    });
}

#[allow(clippy::too_many_arguments)]
fn grid(
    g: &Grid,
    rec: &Recipe,
    ingredient_notes: &[Option<super::md::Rich>],
    factor: f64,
    struck: &HashSet<usize>,
    active: Option<usize>,
    state: &ElementId,
    ctx: &Ctx,
    _window: &mut Window,
    _cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    let ing_span = 2u16;
    let cols = g.width as u16 + ing_span;
    let min_col = 74.;
    let width = ctx.width.max(cols as f32 * min_col);
    let line = alpha(theme.rule, 0.9);

    // step mode: the active step's cell and the rows it combines stay lit, the rest dims
    let hot_rows = active
        .and_then(|a| recipe::placements(g).into_iter().find(|(s, ..)| *s == a))
        .map(|(_, _, r0, n)| r0..r0 + n);
    let dim = active.is_some();
    let mut cells: Vec<AnyElement> = Vec::new();
    for (r, row) in g.rows.iter().enumerate() {
        let i = row.ingredient;
        let lit = hot_rows.as_ref().is_some_and(|h| h.contains(&r));
        let ing = &rec.ingredients[i];
        let off = struck.contains(&i);
        let prev_group = r
            .checked_sub(1)
            .and_then(|p| rec.ingredients[g.rows[p].ingredient].group.as_deref());
        let group = ing.group.as_deref().filter(|gr| Some(*gr) != prev_group);
        let st = state.clone();
        let accent = theme.accent;
        let note = ingredient_notes.get(i).and_then(|n| n.as_ref());
        cells.push(
            div()
                .id(ctx.id("ing"))
                .row_start(r as i16 + 1)
                .col_start(1)
                .col_span(ing_span)
                .cursor_pointer()
                .px(px(8.))
                .py(px(6.))
                .border_b_1()
                .border_r_1()
                .border_color(line)
                .flex()
                .flex_col()
                .gap(px(1.))
                .hover(move |s| s.bg(alpha(accent, 0.05)))
                .when(lit, |d| d.bg(alpha(accent, 0.06)))
                .when(dim && !lit, |d| d.opacity(0.35))
                .when_some(group, |d, gr| {
                    d.child(label(gr.to_uppercase(), theme.accent).text_size(px(12.)))
                })
                .when_some(amount(ing.amount.as_deref(), factor), |d, a| {
                    d.child(
                        div()
                            .italic()
                            .text_size(px(14.))
                            .line_height(px(19.))
                            .text_color(theme.muted)
                            .when(off, |d| d.line_through())
                            .child(a),
                    )
                })
                .child(
                    div()
                        .text_size(px(16.))
                        .line_height(px(21.))
                        .when(off, |d| d.line_through().text_color(theme.muted))
                        .child(ing.item.clone()),
                )
                .when_some(note, |d, n| {
                    d.child(
                        div()
                            .text_size(px(13.))
                            .line_height(px(18.))
                            .text_color(alpha(theme.muted, 0.85))
                            .child(n.text.clone()),
                    )
                })
                .on_click(move |_, window, _| toggle_struck(&st, i, window))
                .into_any_element(),
        );
    }
    for (step, c, r0, n) in recipe::placements(g) {
        let st = &rec.steps[step];
        let hot = active == Some(step);
        let (state_c, rec_c) = (state.clone(), rec.clone());
        let accent = theme.accent;
        cells.push(
            div()
                .id(ctx.id("op"))
                .cursor_pointer()
                .hover(move |s| s.bg(alpha(accent, 0.05)))
                .when(hot, |d| d.bg(alpha(accent, 0.12)))
                .when(dim && !hot, |d| d.opacity(0.35))
                .on_click(move |_, window, cx| {
                    recipe_steps::pick(&state_c, &rec_c, step, window, cx)
                })
                .row_start(r0 as i16 + 1)
                .row_span(n.max(1) as u16)
                .col_start(c as i16 + 1 + ing_span as i16)
                .px(px(7.))
                .py(px(6.))
                .border_b_1()
                .border_r_1()
                .border_color(line)
                .flex()
                .flex_col()
                .justify_center()
                .gap(px(3.))
                .child(
                    div()
                        .italic()
                        .text_size(px(15.))
                        .line_height(px(19.))
                        .child(st.action.clone()),
                )
                .when_some(st.duration.clone(), |d, f| {
                    d.child(
                        div()
                            .font_family(theme::MONO)
                            .text_size(px(11.))
                            .line_height(px(15.))
                            .text_color(theme.accent)
                            .child(f),
                    )
                })
                .into_any_element(),
        );
    }
    // the open cells under shorter branches keep the row's baseline rule
    for (r, row) in g.rows.iter().enumerate() {
        let mut c = 0u16;
        let covered: Vec<(usize, usize, usize, usize)> = recipe::placements(g);
        for cell in &row.cells {
            if let recipe::Cell::Gap { col_span } = cell {
                // find the first uncovered column at or after c
                while (c as usize) < g.width
                    && covered
                        .iter()
                        .any(|(_, cc, r0, n)| *cc == c as usize && r >= *r0 && r < r0 + n)
                {
                    c += 1;
                }
                cells.push(
                    div()
                        .row_start(r as i16 + 1)
                        .col_start(c as i16 + 1 + ing_span as i16)
                        .col_span(*col_span as u16)
                        .border_b_1()
                        .border_color(alpha(line, 0.5))
                        .into_any_element(),
                );
                c += *col_span as u16;
            } else {
                c += 1;
            }
        }
    }

    let grid_el = div()
        .w(px(width))
        .grid()
        .grid_cols(cols)
        .border_t_1()
        .border_l_1()
        .border_color(line)
        .children(cells);
    div()
        .flex()
        .flex_col()
        .gap(px(6.))
        .when(!g.title.is_empty(), |d| {
            d.child(label(g.title.to_uppercase(), theme.accent))
        })
        .child({
            let id = ctx.id("grid");
            // in step mode, bring the step shown into view once each time it changes
            let follow = format!("{id}:follow");
            let seen = state::slot(&follow, || None::<usize>, |f| *f);
            if seen != active {
                state::slot(&follow, || None::<usize>, |f| *f = active);
                if let Some((_, c, ..)) =
                    active.and_then(|a| recipe::placements(g).into_iter().find(|(s, ..)| *s == a))
                {
                    let col_w = width / cols as f32;
                    let x0 = (c as f32 + ing_span as f32) * col_w;
                    render::reveal_in_slide(&id, x0, x0 + col_w, ctx.width, width + 1., _window);
                }
            }
            render::hscroll(id, ctx.width, width + 1., grid_el, theme)
        })
        .into_any_element()
}

fn ingredient_list(
    rec: &Recipe,
    factor: f64,
    struck: &HashSet<usize>,
    state: &ElementId,
    ctx: &Ctx,
) -> AnyElement {
    let theme = ctx.theme;
    let mut col = div()
        .flex()
        .flex_col()
        .gap(px(4.))
        .child(label("INGREDIENTS", theme.accent));
    let mut prev_group = None;
    for (i, ing) in rec.ingredients.iter().enumerate() {
        if ing.group.is_some() && ing.group != prev_group {
            col = col.child(
                div()
                    .pt(px(6.))
                    .italic()
                    .text_color(theme.muted)
                    .child(ing.group.clone().unwrap_or_default()),
            );
            prev_group = ing.group.clone();
        }
        let off = struck.contains(&i);
        let st = state.clone();
        col = col.child(
            div()
                .id(ctx.id("ingl"))
                .cursor_pointer()
                .flex()
                .gap(px(10.))
                .when(off, |d| d.line_through().text_color(theme.muted))
                .when_some(amount(ing.amount.as_deref(), factor), |d, a| {
                    d.child(div().italic().text_color(theme.muted).child(a))
                })
                .child(ing.item.clone())
                .on_click(move |_, window, _| toggle_struck(&st, i, window)),
        );
    }
    col.into_any_element()
}

fn method(
    rec: &Recipe,
    details: &[super::md::Rich],
    active: Option<usize>,
    state: &ElementId,
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    let mut col = div()
        .flex()
        .flex_col()
        .gap(px(10.))
        .child(hairline(theme))
        .child(label("METHOD", theme.accent));
    let mut phase: Option<&str> = None;
    for (i, st) in rec.steps.iter().enumerate() {
        let p = st.phase.as_deref().map(str::trim).filter(|p| !p.is_empty());
        if p != phase {
            if let Some(p) = p {
                col = col.child(
                    div()
                        .pt(px(6.))
                        .italic()
                        .text_size(px(20.))
                        .child(p.to_string()),
                );
            }
            phase = p;
        }
        let hot = active == Some(i);
        let (state_c, rec_c) = (state.clone(), rec.clone());
        let accent = theme.accent;
        col = col.child(
            div()
                .id(ctx.id("step"))
                .cursor_pointer()
                .flex()
                .hover(move |s| s.bg(alpha(accent, 0.04)))
                .when(hot, |d| d.bg(alpha(accent, 0.08)))
                .when(active.is_some() && !hot, |d| d.opacity(0.55))
                .on_click(move |_, window, cx| recipe_steps::pick(&state_c, &rec_c, i, window, cx))
                .child(
                    div()
                        .w(px(30.))
                        .flex_none()
                        .text_color(theme.accent)
                        .child(format!("{}.", i + 1)),
                )
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .flex()
                        .flex_col()
                        .child(ctx.with_width(ctx.width - 30., |c| {
                            render::rich(&details[i], c, window, cx)
                        }))
                        .when_some(st.duration.clone(), |d, f| {
                            d.child(
                                div()
                                    .font_family(theme::MONO)
                                    .text_size(px(12.))
                                    .line_height(px(18.))
                                    .text_color(theme.accent)
                                    .child(f),
                            )
                        }),
                ),
        );
    }
    col.into_any_element()
}
