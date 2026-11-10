use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, SharedString, div};

use crate::api::{Item, Navigate, Paging, SectionRef, TagCount};
use crate::theme::{self, Theme};

use super::format::{clip, encode_segment, fmt_date_short, page_href};
use super::pages::script_title;
use super::render::{alpha, hairline, label};
use super::{column, link};

pub struct Heading<'a> {
    pub title: &'a str,
    pub lede: Option<AnyElement>,
    pub rss: Option<String>,
    pub total: Option<u32>,
}

fn entries(n: u32) -> String {
    format!("{n} {}", if n == 1 { "entry" } else { "entries" })
}

fn heading(h: Heading, key: &str, nav: &Navigate, theme: &Theme) -> gpui::Div {
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

pub(super) struct Card<'a> {
    pub title: &'a str,
    pub href: &'a str,
    pub section: Option<&'a str>,
    pub published_at: Option<&'a str>,
    pub blurb: Option<&'a str>,
}

#[derive(Clone, Copy, PartialEq)]
pub(super) enum CardSize {
    Listing,
    Related,
}

pub(super) fn card(
    id: SharedString,
    c: Card,
    size: CardSize,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let listing = size == CardSize::Listing;
    let (title_size, blurb_size, blurb_leading, blurb_chars) = if listing {
        (22., 16., 24., 200)
    } else {
        (19., 15., 22., 160)
    };
    div()
        .flex()
        .flex_col()
        .gap(px(2.))
        .when(listing, |d| {
            d.pb(px(14.))
                .border_b_1()
                .border_color(alpha(theme.rule, 0.6))
        })
        .child(
            div()
                .flex()
                .items_baseline()
                .justify_between()
                .map(|d| {
                    if listing {
                        d.flex_wrap().gap_x(px(18.)).gap_y(px(2.))
                    } else {
                        d.gap(px(16.))
                    }
                })
                .child(
                    link(id, c.title, c.href, nav, theme)
                        .italic()
                        .text_size(px(title_size))
                        .when(listing, |d| d.line_height(px(30.))),
                )
                .child(
                    div()
                        .flex_none()
                        .flex()
                        .items_baseline()
                        .gap(px(10.))
                        .when_some(c.section.filter(|s| !s.is_empty()), |d, s| {
                            d.child(label(s.to_uppercase(), theme.section(s)))
                        })
                        .when_some(c.published_at.map(fmt_date_short), |d, date| {
                            d.child(label(date.to_uppercase(), theme.muted))
                        }),
                ),
        )
        .when_some(c.blurb.filter(|b| !b.trim().is_empty()), |d, b| {
            d.child(
                div()
                    .text_size(px(blurb_size))
                    .line_height(px(blurb_leading))
                    .text_color(theme.muted)
                    .child(clip(b, blurb_chars)),
            )
        })
        .into_any_element()
}

pub(super) fn frame(
    h: Heading,
    key: &str,
    gap: f32,
    empty: &str,
    body: Vec<AnyElement>,
    nav: &Navigate,
    theme: &Theme,
) -> gpui::Div {
    column(theme)
        .gap(px(gap))
        .child(heading(h, key, nav, theme))
        .when(body.is_empty(), |d| {
            d.child(
                div()
                    .italic()
                    .text_color(theme.muted)
                    .child(empty.to_string()),
            )
        })
        .children(body)
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
    let cards = items
        .iter()
        .enumerate()
        .map(|(i, it)| {
            card(
                SharedString::from(format!("{key}:{i}")),
                Card {
                    title: &it.title,
                    href: &it.href,
                    section: kind.then_some(it.section.as_str()),
                    published_at: it.published_at.as_deref(),
                    blurb: it.excerpt.as_deref(),
                },
                CardSize::Listing,
                nav,
                theme,
            )
        })
        .collect();
    frame(h, &key, 14., "No entries published yet.", cards, nav, theme)
        .child(pagination(base, paging, &key, nav, theme))
        .into_any_element()
}

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

pub fn content_listing(
    items: &[Item],
    sections: &[crate::api::Section],
    paging: &Paging,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let total = paging.total;
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
    frame(
        Heading {
            title: "Tags",
            lede,
            rss: None,
            total: None,
        },
        "tags",
        14.,
        "No tags yet.",
        if tags.is_empty() {
            Vec::new()
        } else {
            vec![cloud.into_any_element()]
        },
        nav,
        theme,
    )
    .into_any_element()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pages_listed_are_the_ends_and_the_current_with_its_neighbours() {
        assert_eq!(
            page_list(5, 9),
            vec![Some(1), None, Some(4), Some(5), Some(6), None, Some(9)]
        );
        assert_eq!(page_list(1, 3), vec![Some(1), Some(2), Some(3)]);
        assert_eq!(page_list(3, 4), vec![Some(1), Some(2), Some(3), Some(4)]);
    }
}
