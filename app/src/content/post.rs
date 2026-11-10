use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{Navigate, Paging, Post};
use crate::design;
use crate::select::Selection;
use crate::theme::{self, Theme};

use super::doc::{Colophon, colophon, terrazzo_banner};
use super::format::{encode_segment, fmt_date};
use super::listing::{Heading, frame};
use super::pages::{Prose, measure};
use super::render::{self, double_rule};
use super::{column, link};

pub(super) fn post_body(
    post: &Post,
    single: bool,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let key = format!("post:{}", post.rkey);
    let (parsed, ctx) = Prose::post(post, single).of(theme, nav, sel, key.clone(), window);
    let date = fmt_date(&post.created_at);
    let href = href(post);

    let mut col = div().flex().flex_col().gap(px(14.));
    col = col.child(
        link(
            SharedString::from(format!("{key}:date")),
            &date.to_uppercase(),
            &href,
            nav,
            theme,
        )
        .font_family(theme::SANS)
        .font_weight(gpui::FontWeight::MEDIUM)
        .text_size(px(design::LABEL_SIZE))
        .letter_spacing(px(design::LABEL_TRACKING))
        .text_color(theme.accent),
    );
    col = col.child(
        div()
            .flex()
            .flex_col()
            .gap(px(14.))
            .when(single, |d| d.text_size(px(21.)).line_height(px(33.)))
            .children(render::blocks(&parsed.blocks, &ctx, window, cx)),
    );
    if single && !post.tags.is_empty() {
        col = col.child(tag_row(&post.tags, &key, nav, theme));
    }
    col.into_any_element()
}

pub fn feed(
    posts: &[Post],
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let lede = Some(
        div()
            .child("Short posts from iammatthias.")
            .into_any_element(),
    );
    // later pages arrive as the end of the list comes near
    let (more, tail) = super::feed::extra(posts, paging);
    let mut body = Vec::new();
    for (i, p) in posts.iter().chain(more.iter().map(|p| &**p)).enumerate() {
        if i > 0 {
            body.push(double_rule(theme, 48.).into_any_element());
        }
        body.push(post_body(p, false, nav, theme, sel, window, cx));
    }
    frame(
        Heading {
            title: "Feed",
            lede,
            rss: Some("/feed/rss.xml".into()),
            total: Some(paging.total),
        },
        "feed",
        26.,
        "Nothing recent.",
        body,
        nav,
        theme,
    )
    .child(super::feed::tail(tail, theme))
    .into_any_element()
}

pub fn post(
    post: &Post,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    column(theme)
        .gap(px(20.))
        .child(
            link("post:back", "← FEED", "/feed", nav, theme)
                .font_family(theme::SANS)
                .font_weight(gpui::FontWeight::MEDIUM)
                .text_size(px(design::LABEL_SIZE))
                .letter_spacing(px(design::LABEL_TRACKING)),
        )
        .child(post_body(post, true, nav, theme, sel, window, cx))
        .child(div().pt(px(12.)).child(double_rule(theme, 64.)))
        .child(terrazzo_banner(
            &post.rkey,
            &post.cid,
            measure(window),
            window,
            cx,
        ))
        .child(colophon(
            Colophon {
                section: "Feed",
                published_at: Some(&post.created_at),
                updated_at: post.updated_at.as_deref(),
                cid: &post.cid,
                href: &href(post),
            },
            &format!("post:{}", post.rkey),
            theme,
            sel,
        ))
        .into_any_element()
}

fn href(post: &Post) -> String {
    if post.href.is_empty() {
        format!("/feed/{}", post.rkey)
    } else {
        post.href.clone()
    }
}

/// Tags as quiet italic links: `ai · generative · photography`.
fn tag_row(tags: &[String], key: &str, nav: &Navigate, theme: &Theme) -> AnyElement {
    let mut row = div()
        .flex()
        .flex_wrap()
        .items_baseline()
        .gap_x(px(6.))
        .gap_y(px(2.));
    for (i, t) in tags.iter().enumerate() {
        if i > 0 {
            row = row.child(div().text_color(theme.muted).child("·"));
        }
        let accent = theme.accent;
        let ink = theme.ink;
        let nav = nav.clone();
        let href = format!("/tags/{}", encode_segment(t));
        row = row.child(
            div()
                .id(SharedString::from(format!("{key}:tag{i}")))
                .cursor_pointer()
                .italic()
                .text_color(ink)
                .hover_style(move |s| s.text_color(accent))
                .child(t.to_lowercase())
                .on_click(move |_, window, cx| nav(href.clone(), window, cx)),
        );
    }
    row.into_any_element()
}
