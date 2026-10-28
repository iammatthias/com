//! Series layouts: the tile grid (with still+video "live" tiles), the flow of images and
//! prose, and the phosphene triptych (photo · poem · dreamed image).

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, Window, div};

use crate::theme;

use super::md::Block;
use super::media;
use super::render::{self, Ctx};
use super::series::{Capture, FlowPart, SeriesMedia, SeriesTree, Stanza, TriptychPart};

const GAP: f32 = 12.;

pub fn view(tree: &SeriesTree, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    match tree {
        SeriesTree::Grid(caps) => grid(caps, ctx),
        SeriesTree::Flow(parts) => flow(parts, ctx, window, cx),
        SeriesTree::Triptych(parts) => triptych(parts, ctx, window, cx),
        SeriesTree::Empty => div().into_any_element(),
    }
}

fn grid(caps: &[Capture], ctx: &Ctx) -> AnyElement {
    let col_w = (ctx.width - GAP) / 2.;
    let tiles = caps
        .iter()
        .map(|c| match c {
            Capture::Still(m) | Capture::Video(m) => (
                media::aspect_of(&m.src, ctx),
                media::figure(&m.src, &m.alt, col_w, false, ctx),
            ),
            Capture::Live { still, movie } => (
                media::aspect_of(&still.src, ctx),
                live(still, movie, col_w, ctx),
            ),
        })
        .collect();
    media::two_columns(tiles, ctx.width, GAP)
}

/// A still that has motion behind it: the photograph, and the clip laid over it while the
/// tile is hovered (or, without hover, while it is well in view). The lettered "live" plays
/// or stops the motion by hand, which is how it moves with reduced motion.
fn live(still: &SeriesMedia, movie: &SeriesMedia, width: f32, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    let url = media::original_url(&movie.src);
    let key = format!("{}:{url}", ctx.key);
    let (hover_key, toggle_key) = (key.clone(), key.clone());
    let accent = theme.accent;
    div()
        .id(ctx.id("livetile"))
        .relative()
        .on_hover(move |on, _, _| crate::dom_video::hover(&hover_key, *on))
        .child(media::figure(&still.src, &still.alt, width, false, ctx))
        .child(media::clip_probe(
            key,
            url,
            None,
            crate::dom_video::Mode::Live,
        ))
        .child(
            div()
                .id(ctx.id("live"))
                .cursor_pointer()
                .absolute()
                .top(px(10.))
                .left(px(10.))
                // the controls' glass, in miniature: the photograph shows through a frosted
                // paper pill with a bright rim, the word in the plate's hand
                .h(px(28.))
                .px(px(12.))
                .rounded_full()
                .bg(theme.veil(0.62))
                .border_1()
                .border_color(gpui::Rgba {
                    alpha: 0.75,
                    ..gpui::rgb(0xffffff)
                })
                .shadow_md()
                .flex()
                .items_center()
                .gap(px(6.))
                .child(div().size(px(6.)).rounded_full().bg(accent))
                .child(
                    div()
                        .font_family(crate::theme::SCRIPT)
                        .text_size(px(16.))
                        .text_color(theme.ink)
                        .child("live"),
                )
                .hover_style(move |s| s.bg(theme.veil(0.8)))
                .on_click(move |_, window, _| {
                    crate::dom_video::toggle(&toggle_key);
                    window.refresh();
                }),
        )
        .into_any_element()
}

fn flow(parts: &[FlowPart], ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    div()
        .flex()
        .flex_col()
        .gap(px(18.))
        .children(parts.iter().map(|p| match p {
            FlowPart::Media(m) => media::figure(&m.src, &m.alt, ctx.width, true, ctx),
            FlowPart::Text(blocks) => render::stack(blocks, ctx, window, cx).into_any_element(),
        }))
        .into_any_element()
}

fn stanza(s: &Stanza, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    div()
        .flex()
        .flex_col()
        .items_center()
        .gap(px(10.))
        .children(s.lines.iter().map(|b| {
            match b {
                Block::Para(r) => div()
                    .text_center()
                    .italic()
                    .text_size(px(20.))
                    .line_height(px(32.))
                    .child(render::rich(r, ctx, window, cx))
                    .into_any_element(),
                other => render::block(other, ctx, window, cx),
            }
        }))
        .when_some(s.note.as_ref(), |d, note| {
            d.child(
                div()
                    .max_w(px(ctx.width * 0.8))
                    .text_center()
                    .font_family(theme::MONO)
                    .text_size(px(12.))
                    .line_height(px(19.))
                    .text_color(theme.muted)
                    .child(note.text.clone()),
            )
        })
        .into_any_element()
}

fn triptych(parts: &[TriptychPart], ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    let narrow = ctx.width < 440.;
    let img_w = if narrow {
        ctx.width
    } else {
        (ctx.width - 16.) / 2.
    };
    let panels: Vec<AnyElement> = parts
        .iter()
        .enumerate()
        .map(|(i, p)| match p {
            TriptychPart::Loose(s) => div()
                .text_color(theme.muted)
                .child(stanza(s, ctx, window, cx))
                .into_any_element(),
            TriptychPart::Panel {
                left,
                right,
                text,
                caption,
            } => {
                let pair = div()
                    .flex()
                    .when(narrow, |d| d.flex_col())
                    .gap(px(16.))
                    .justify_center()
                    .child(media::figure(&left.src, &left.alt, img_w, false, ctx))
                    .when_some(right.as_ref(), |d, r| {
                        d.child(media::figure(&r.src, &r.alt, img_w, false, ctx))
                    });
                div()
                    .flex()
                    .flex_col()
                    .gap(px(20.))
                    .when(i > 0, |d| d.pt(px(14.)))
                    .when(i > 0, |d| d.child(render::double_rule(theme, 64.)))
                    .child(pair)
                    .children(text.iter().map(|s| stanza(s, ctx, window, cx)))
                    .children(caption.iter().map(|s| {
                        div()
                            .font_family(theme::MONO)
                            .text_size(px(12.))
                            .text_color(theme.muted)
                            .child(stanza(s, ctx, window, cx))
                    }))
                    .into_any_element()
            }
        })
        .collect();
    div()
        .flex()
        .flex_col()
        .gap(px(36.))
        .children(panels)
        .into_any_element()
}
