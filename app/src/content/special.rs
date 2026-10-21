//! Pages @com builds from its own components rather than prose: now, resume, developers.

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{Developers, Navigate, Now, ResumeSection};
use crate::theme::{self, Theme};

use super::pages;
use super::render::{alpha, double_rule, hairline, label};
use super::{column, link};

fn section_label(text: &str, theme: &Theme) -> gpui::Div {
    label(text.to_uppercase(), theme.accent).pt(px(10.))
}

fn mono(text: impl Into<SharedString>, theme: &Theme) -> gpui::Div {
    div()
        .font_family(theme::MONO)
        .text_size(px(13.))
        .text_color(alpha(theme.ink, 0.85))
        .child(text.into())
}

// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------

pub fn now(
    n: &Now,
    nav: &Navigate,
    theme: &Theme,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let title = if n.title.is_empty() { "Now" } else { &n.title };
    let mut col = column(theme)
        .gap(px(16.))
        .child(pages::script_title(title, theme))
        .child(hairline(theme));
    if !n.bio.trim().is_empty() {
        col = col.child(pages::markdown(&n.bio, "now:bio", nav, theme, window, cx));
    }
    if !n.working.trim().is_empty() {
        col = col
            .child(section_label("Working on", theme))
            .child(pages::markdown(
                &n.working,
                "now:working",
                nav,
                theme,
                window,
                cx,
            ));
    }
    if !n.recent.is_empty() {
        col = col.child(section_label("Recent updates", theme));
        for (i, p) in n.recent.iter().enumerate() {
            if i > 0 {
                col = col.child(double_rule(theme, 48.));
            }
            col = col.child(pages::post_body(p, false, nav, theme, window, cx));
        }
        col = col.child(
            link("now:feed", "All updates →", "/feed", nav, theme)
                .font_family(theme::SANS)
                .text_size(px(14.)),
        );
    }
    if !n.find_me.is_empty() {
        col = col.child(section_label("Find me", theme)).child(
            div()
                .flex()
                .flex_wrap()
                .gap_x(px(18.))
                .gap_y(px(6.))
                .children(n.find_me.iter().enumerate().map(|(i, l)| {
                    div()
                        .flex()
                        .items_baseline()
                        .gap(px(6.))
                        .child(link(("now:find", i), &l.label, &l.href, nav, theme).italic())
                        .when_some(l.username.clone(), |d, u| {
                            d.child(div().text_size(px(14.)).text_color(theme.muted).child(u))
                        })
                })),
        );
    }
    col.into_any_element()
}

// ---------------------------------------------------------------------------------------------

pub fn resume(
    title: &str,
    sections: &[ResumeSection],
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let title = if title.is_empty() { "Resume" } else { title };
    let mut col = column(theme)
        .gap(px(14.))
        .child(pages::script_title(title, theme))
        .child(hairline(theme));
    for (si, s) in sections.iter().enumerate() {
        col = col.child(section_label(&s.title, theme));
        for (ei, e) in s.entries.iter().enumerate() {
            let company: AnyElement = match e.href.as_deref() {
                Some(h) => link(
                    SharedString::from(format!("resume:{si}:{ei}")),
                    &e.company,
                    h,
                    nav,
                    theme,
                )
                .italic()
                .text_size(px(20.))
                .into_any_element(),
                None => div()
                    .italic()
                    .text_size(px(20.))
                    .child(e.company.clone())
                    .into_any_element(),
            };
            col = col.child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(2.))
                    .pb(px(10.))
                    .border_b_1()
                    .border_color(alpha(theme.rule, 0.6))
                    .child(
                        div()
                            .flex()
                            .items_baseline()
                            .justify_between()
                            .gap(px(16.))
                            .child(company)
                            .child(label(e.date.to_uppercase(), theme.muted).flex_none()),
                    )
                    .child(
                        div()
                            .text_size(px(16.))
                            .text_color(theme.muted)
                            .child(e.position.clone()),
                    ),
            );
        }
    }
    col.into_any_element()
}

// ---------------------------------------------------------------------------------------------

pub fn developers(
    d: &Developers,
    nav: &Navigate,
    theme: &Theme,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let title = if d.title.is_empty() {
        "Developers"
    } else {
        &d.title
    };
    let mut col = column(theme)
        .gap(px(16.))
        .child(pages::script_title(title, theme));
    if !d.lede.trim().is_empty() {
        col = col.child(pages::markdown(&d.lede, "dev:lede", nav, theme, window, cx));
    }
    if !d.markdown_href.is_empty() {
        col = col.child(
            link(
                "dev:md",
                "This page as markdown →",
                &d.markdown_href,
                nav,
                theme,
            )
            .font_family(theme::SANS)
            .text_size(px(14.)),
        );
    }
    col = col.child(hairline(theme));
    if !d.quickstart.trim().is_empty() {
        col = col.child(section_label("Quickstart", theme)).child(
            div()
                .p(px(14.))
                .rounded(px(8.))
                .bg(alpha(theme.ink, 0.05))
                .border_1()
                .border_color(theme.edge())
                .overflow_hidden()
                // one line per row, wrapped inside the box: long commands never widen the column
                .children(d.quickstart.trim_end().lines().map(|l| {
                    mono(l.to_string(), theme)
                        .w_full()
                        .whitespace_normal()
                        .min_h(px(18.))
                })),
        );
    }
    if !d.endpoints.is_empty() {
        col = col.child(section_label("Endpoints", theme));
        for (i, e) in d.endpoints.iter().enumerate() {
            col = col.child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(2.))
                    .pb(px(8.))
                    .border_b_1()
                    .border_color(alpha(theme.rule, 0.6))
                    .child(
                        link(("dev:ep", i), &e.label, &e.href, nav, theme)
                            .font_family(theme::MONO)
                            .text_size(px(14.))
                            .w_full()
                            .whitespace_normal(),
                    )
                    .child(
                        div()
                            .text_size(px(16.))
                            .text_color(theme.muted)
                            .child(e.description.clone()),
                    ),
            );
        }
    }
    // the first section is the note that follows the endpoint list on @com
    for (i, s) in d.sections.iter().enumerate() {
        if i > 0 || d.endpoints.is_empty() {
            col = col.child(section_label(&s.title, theme));
        }
        col = col.child(pages::markdown(
            &s.body,
            &format!("dev:s{i}"),
            nav,
            theme,
            window,
            cx,
        ));
    }
    col.into_any_element()
}
