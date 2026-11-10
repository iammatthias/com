use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, SharedString, div};

use crate::api::{Item, Navigate, Paging, SectionRef, TagCount};
use crate::design;
use crate::theme::{self, Theme};

use super::format::{clip, encode_segment, fmt_date_short, page_href};
use super::pages::script_title;
use super::render::{alpha, hairline, label};
use super::{column, link};

/// What sits over a listing, as @com's page header: the title, a line about it, and its
/// feed and count.
pub struct Heading<'a> {
    pub title: &'a str,
    pub lede: Option<AnyElement>,
    pub rss: Option<String>,
    pub total: Option<u32>,
}

fn entries(n: u32) -> String {
    format!("{n} {}", if n == 1 { "entry" } else { "entries" })
}

pub(super) fn heading(h: Heading, key: &str, nav: &Navigate, theme: &Theme) -> gpui::Div {
    let mut meta = div()
        .flex()
        .items_baseline()
        .gap(px(8.))
        .text_size(px(14.))
        .text_color(theme.muted);
    let mut any = false;
    if let Some(rss) = h.rss {
        meta = meta.child(
            link(
                SharedString::from(format!("{key}:rss")),
                "RSS",
                &rss,
                nav,
                theme,
            )
            .text_size(px(14.)),
        );
        any = true;
    }
    if let Some(n) = h.total.filter(|n| *n > 0) {
        if any {
            meta = meta.child("·");
        }
        meta = meta.child(entries(n));
        any = true;
    }
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(script_title(h.title, theme))
        .when_some(h.lede, |d, lede| {
            d.child(div().text_size(px(18.)).line_height(px(28.)).child(lede))
        })
        .when(any, |d| d.child(meta))
        .child(div().pt(px(4.)).child(hairline(theme)))
}

/// One entry in a listing, as @com's FeedCard: title, its section (in the section's colour),
/// date, and the first lines of its description.
fn card(i: usize, it: &Item, key: &str, kind: bool, nav: &Navigate, theme: &Theme) -> AnyElement {
    let date = it.published_at.as_deref().map(fmt_date_short);
    div()
        .flex()
        .flex_col()
        .gap(px(2.))
        .pb(px(14.))
        .border_b_1()
        .border_color(alpha(theme.rule, 0.6))
        .child(
            div()
                .flex()
                .flex_wrap()
                .items_baseline()
                .justify_between()
                .gap_x(px(18.))
                .gap_y(px(2.))
                .child(
                    link(
                        SharedString::from(format!("{key}:{i}")),
                        &it.title,
                        &it.href,
                        nav,
                        theme,
                    )
                    .italic()
                    .text_size(px(22.))
                    .line_height(px(30.)),
                )
                .child(
                    div()
                        .flex_none()
                        .flex()
                        .items_baseline()
                        .gap(px(10.))
                        .when(kind && !it.section.is_empty(), |d| {
                            d.child(
                                label(it.section.to_uppercase(), theme.section(&it.section))
                                    .text_size(px(design::LABEL_SIZE)),
                            )
                        })
                        .when_some(date, |d, date| {
                            d.child(
                                label(date.to_uppercase(), theme.muted)
                                    .text_size(px(design::LABEL_SIZE)),
                            )
                        }),
                ),
        )
        .when_some(
            it.excerpt.clone().filter(|e| !e.trim().is_empty()),
            |d, e| {
                d.child(
                    div()
                        .text_size(px(16.))
                        .line_height(px(24.))
                        .text_color(theme.muted)
                        .child(clip(&e, 200)),
                )
            },
        )
        .into_any_element()
}

pub fn listing(
    h: Heading,
    items: &[Item],
    kind: bool,
    base: &str,
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let key = format!("list:{base}:{}", paging.page);
    let mut col = column(theme)
        .gap(px(14.))
        .child(heading(h, &key, nav, theme));
    if items.is_empty() {
        col = col.child(
            div()
                .italic()
                .text_color(theme.muted)
                .child("No entries published yet."),
        );
    }
    for (i, it) in items.iter().enumerate() {
        col = col.child(card(i, it, &key, kind, nav, theme));
    }
    col.child(pagination(base, paging, &key, nav, theme))
        .into_any_element()
}

/// @com's page list: the first, the last, and the current page with its neighbours.
fn page_list(current: u32, last: u32) -> Vec<Option<u32>> {
    let mut include: Vec<u32> = vec![1, last, current];
    for i in current.saturating_sub(1)..=current + 1 {
        if i >= 1 && i <= last {
            include.push(i);
        }
    }
    include.sort_unstable();
    include.dedup();
    let mut out = Vec::new();
    let mut prev = 0;
    for n in include {
        if prev != 0 && n - prev > 1 {
            out.push(None);
        }
        out.push(Some(n));
        prev = n;
    }
    out
}

pub fn pagination(
    base: &str,
    paging: &Paging,
    key: &str,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let pages = paging.pages;
    if pages <= 1 {
        return div().into_any_element();
    }
    let page = paging.page.max(1);
    let edge = |id: &str, text: &str, href: Option<String>| -> AnyElement {
        match href {
            Some(h) => link(
                SharedString::from(format!("{key}:{id}")),
                text,
                &h,
                nav,
                theme,
            )
            .font_family(theme::SANS)
            .text_size(px(14.))
            .into_any_element(),
            None => div()
                .font_family(theme::SANS)
                .text_size(px(14.))
                .text_color(alpha(theme.muted, 0.5))
                .child(text.to_string())
                .into_any_element(),
        }
    };
    let numbers = div()
        .flex()
        .items_baseline()
        .gap(px(12.))
        .font_family(theme::SANS)
        .text_size(px(14.))
        .children(page_list(page, pages).into_iter().map(|n| {
            match n {
                None => div().text_color(theme.muted).child("…").into_any_element(),
                Some(n) if n == page => div()
                    .px(px(8.))
                    .py(px(2.))
                    .rounded(px(6.))
                    .bg(theme.ink)
                    .text_color(theme.paper)
                    .child(n.to_string())
                    .into_any_element(),
                Some(n) => link(
                    SharedString::from(format!("{key}:p{n}")),
                    &n.to_string(),
                    &page_href(base, n),
                    nav,
                    theme,
                )
                .font_family(theme::SANS)
                .text_size(px(14.))
                .into_any_element(),
            }
        }));
    div()
        .pt(px(10.))
        .flex()
        .items_center()
        .justify_between()
        .gap(px(12.))
        .child(edge(
            "newer",
            "← Newer",
            (page > 1).then(|| page_href(base, page - 1)),
        ))
        .child(numbers)
        .child(edge(
            "older",
            "Older →",
            (page < pages).then(|| page_href(base, page + 1)),
        ))
        .into_any_element()
}

pub fn section_listing(
    section: &SectionRef,
    items: &[Item],
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let lede = section
        .description
        .clone()
        .filter(|d| !d.trim().is_empty())
        .map(|d| div().child(d).into_any_element());
    listing(
        Heading {
            title: &section.name,
            lede,
            rss: Some(format!("/{}/rss.xml", section.slug)),
            total: Some(section.count),
        },
        items,
        false,
        &format!("/{}", section.slug),
        paging,
        nav,
        theme,
    )
}

/// @com's /content: every entry, newest first, with where it was published.
pub fn content_listing(
    items: &[Item],
    sections: &[crate::api::Section],
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let total = paging.total;
    // publications with nothing in them yet aren't worth a link
    let sections: Vec<&crate::api::Section> = sections.iter().filter(|s| s.count > 0).collect();
    let lede = (total > 0).then(|| {
        let mut line = div()
            .flex()
            .flex_wrap()
            .items_baseline()
            .gap_x(px(6.))
            .child(format!(
                "{} across {} publications:",
                entries(total),
                sections.len()
            ));
        for (i, s) in sections.iter().enumerate() {
            let sep = if i + 1 < sections.len() { "," } else { "." };
            line = line.child(
                div()
                    .flex()
                    .items_baseline()
                    .child(
                        link(
                            SharedString::from(format!("content:pub{i}")),
                            &s.name.to_lowercase(),
                            &format!("/{}", s.slug),
                            nav,
                            theme,
                        )
                        .text_color(theme.section(&s.slug)),
                    )
                    .child(sep),
            );
        }
        line.into_any_element()
    });
    listing(
        Heading {
            title: "Content",
            lede,
            rss: None,
            total: None,
        },
        items,
        true,
        "/content",
        paging,
        nav,
        theme,
    )
}

/// A tag's entries, under the tag index.
pub fn tag_listing(
    tag: &str,
    items: &[Item],
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let base = format!("/tags/{}", encode_segment(tag));
    let crumbs = div()
        .flex()
        .items_baseline()
        .gap(px(8.))
        .text_size(px(14.))
        .text_color(theme.muted)
        .child(link("tag:crumb", "tags", "/tags", nav, theme).text_size(px(14.)))
        .child("›")
        .child(tag.to_string())
        .into_any_element();
    listing(
        Heading {
            title: tag,
            lede: Some(crumbs),
            rss: Some(format!("{base}/rss.xml")),
            total: Some(paging.total),
        },
        items,
        true,
        &base,
        paging,
        nav,
        theme,
    )
}

pub fn tags(tags: &[TagCount], nav: &Navigate, theme: &Theme) -> AnyElement {
    let max = tags.iter().map(|t| t.count).max().unwrap_or(1).max(1) as f32;
    // by frequency, then name, as @com orders them
    let mut sorted: Vec<&TagCount> = tags.iter().collect();
    sorted.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.tag.cmp(&b.tag)));
    let mut cloud = div()
        .flex()
        .flex_wrap()
        .items_baseline()
        .gap_x(px(18.))
        .gap_y(px(6.));
    for (i, t) in sorted.iter().enumerate() {
        let weight = (t.count as f32 / max).sqrt();
        let size = 15. + 17. * weight;
        let nav = nav.clone();
        let href = format!("/tags/{}", encode_segment(&t.tag));
        let accent = theme.accent;
        let color = if weight > 0.6 {
            theme.accent
        } else {
            theme.ink
        };
        cloud = cloud.child(
            div()
                .id(("tagcloud", i))
                .cursor_pointer()
                .flex()
                .items_baseline()
                .gap(px(3.))
                .text_color(color)
                .hover_style(move |s| s.text_color(accent))
                .child(
                    div()
                        .font_family(theme::DISPLAY)
                        .text_size(px(size))
                        .line_height(px(size * 1.4))
                        .child(t.tag.clone()),
                )
                .child(
                    div()
                        .text_size(px(12.))
                        .text_color(theme.muted)
                        .child(t.count.to_string()),
                )
                .on_click(move |_, window, cx| nav(href.clone(), window, cx)),
        );
    }
    let lede = Some(
        div()
            .child(format!("{} unique tags across the archive.", tags.len()))
            .into_any_element(),
    );
    column(theme)
        .gap(px(14.))
        .child(heading(
            Heading {
                title: "Tags",
                lede,
                rss: None,
                total: None,
            },
            "tags",
            nav,
            theme,
        ))
        .child(if tags.is_empty() {
            div().italic().text_color(theme.muted).child("No tags yet.")
        } else {
            cloud
        })
        .into_any_element()
}
