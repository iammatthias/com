use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{Doc, Navigate, Paging, Post, SectionRef};
use crate::design;
use crate::select::Selection;
use crate::theme::{self, Theme};

use super::doc::{colophon, terrazzo_banner};
use super::format::{encode_segment, fmt_date};
use super::listing::{Heading, heading};
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
    let href = if post.href.is_empty() {
        format!("/feed/{}", post.rkey)
    } else {
        post.href.clone()
    };

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
    let mut col = column(theme).gap(px(26.)).child(heading(
        Heading {
            title: "Feed",
            lede,
            rss: Some("/feed/rss.xml".into()),
            total: Some(paging.total),
        },
        "feed",
        nav,
        theme,
    ));
    if posts.is_empty() {
        col = col.child(
            div()
                .italic()
                .text_color(theme.muted)
                .child("Nothing recent."),
        );
    }
    // later pages arrive as the end of the list comes near
    let (more, tail) = super::feed::extra(posts, paging);
    for (i, p) in posts.iter().chain(more.iter().map(|p| &**p)).enumerate() {
        if i > 0 {
            col = col.child(double_rule(theme, 48.));
        }
        col = col.child(post_body(p, false, nav, theme, sel, window, cx));
    }
    col.child(super::feed::tail(tail, theme)).into_any_element()
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
            &Doc {
                section: SectionRef {
                    slug: "feed".into(),
                    name: "Feed".into(),
                    ..Default::default()
                },
                rkey: post.rkey.clone(),
                cid: post.cid.clone(),
                href: if post.href.is_empty() {
                    format!("/feed/{}", post.rkey)
                } else {
                    post.href.clone()
                },
                published_at: Some(post.created_at.clone()),
                updated_at: post.updated_at.clone(),
                ..Default::default()
            },
            &format!("post:{}", post.rkey),
            nav,
            theme,
            sel,
        ))
        .into_any_element()
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
