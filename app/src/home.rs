use gpui::prelude::*;
use gpui::{AnyElement, SharedString, div, px};

use crate::api::{Index, Item, Navigate};
use crate::content;
use crate::drawers::Drawer;
use crate::prefs;
use crate::search::Hit;
use crate::theme::{self, Theme};

#[derive(Clone, Default)]
pub struct Home {
    pub section: Option<String>,
    pub open: Option<Drawer>,
    pub plain: bool,
    pub query: String,
}

impl Home {
    pub fn restore() -> Self {
        Self {
            section: None,
            open: None,
            plain: prefs::get("engraving").as_deref() == Some("off")
                || prefs::get("view").as_deref() == Some("list"),
            query: String::new(),
        }
    }

    pub fn narrowed(&self) -> bool {
        self.section.is_some() || !self.query.trim().is_empty()
    }

    pub fn matches<'a>(&self, index: &'a Index) -> Vec<&'a Item> {
        let q = self.query.trim().to_lowercase();
        if q.is_empty() {
            return Vec::new();
        }
        index
            .items
            .iter()
            .filter(|i| matches_query(i, &q))
            .collect()
    }

    pub fn results(&self, index: Option<&Index>, by_meaning: &[Hit]) -> Vec<(String, String)> {
        let mut found: Vec<(String, String)> = index
            .map(|ix| {
                self.matches(ix)
                    .into_iter()
                    .map(|it| (it.title.clone(), it.href.clone()))
                    .collect()
            })
            .unwrap_or_default();
        for hit in by_meaning {
            if found.iter().any(|(_, href)| *href == hit.href) {
                continue;
            }
            let title = index
                .and_then(|ix| ix.feed.iter().find(|f| f.href == hit.href))
                .map(|f| note_line(&f.excerpt, &f.created_at))
                .unwrap_or_else(|| hit.title.clone());
            found.push((title, hit.href.clone()));
        }
        found
    }
}

pub fn matches_query(item: &Item, q_lower: &str) -> bool {
    if q_lower.is_empty() {
        return true;
    }
    match &item.lower {
        Some((title, tags)) => title.contains(q_lower) || tags.iter().any(|t| t.contains(q_lower)),
        None => {
            item.title.to_lowercase().contains(q_lower)
                || item.tags.iter().any(|t| t.to_lowercase().contains(q_lower))
        }
    }
}

fn deck(index: &Index, nav: &Navigate, t: &Theme, window: &gpui::Window) -> AnyElement {
    let t = *t;
    let mut col = div().w_full().flex().flex_col().gap(px(36.));

    if let Some(pick) = index.glass_pick.as_ref() {
        let vh = f32::from(window.viewport_size().height);
        let vw = f32::from(window.viewport_size().width);
        let h = (vh * 0.7).min(640.0).min((vw - 40.0) * 7.0 / 6.0);
        let w = h * 6.0 / 7.0;
        let tint = pick
            .prominent_color
            .as_deref()
            .and_then(crate::content::parse_color)
            .unwrap_or(t.rule);
        let c = &pick.caption;
        let details: Vec<String> = [c.equipment.clone(), c.settings.clone(), c.date.clone()]
            .into_iter()
            .flatten()
            .collect();
        let mut caption = div()
            .flex()
            .flex_col()
            .items_center()
            .gap(px(2.))
            .text_center()
            .font_family(theme::SANS)
            .text_size(px(12.))
            .line_height(px(20.))
            .text_color(t.muted);
        if let Some(series) = c.series.clone() {
            caption = caption.child(
                content::link("deck:glass", &series, &pick.href, nav, &t)
                    .font_family(theme::SANS)
                    .font_weight(gpui::FontWeight::MEDIUM)
                    .text_size(px(13.)),
            );
        }
        caption = caption.children(details.into_iter().map(|d| div().child(d)));
        col = col.child(
            div()
                .flex()
                .flex_col()
                .items_center()
                .gap(px(16.))
                .child(
                    div()
                        .w(px(w))
                        .h(px(h))
                        .rounded_tl(px(w / 2.0))
                        .rounded_tr(px(w / 2.0))
                        .border(px(6.))
                        .border_color(tint)
                        .bg(tint)
                        .overflow_hidden()
                        .child(crate::content::media::picture(
                            pick.image.clone(),
                            move |i| {
                                i.size_full()
                                    .object_fit(gpui::ObjectFit::Cover)
                                    .rounded_tl(px(w / 2.0 - 6.0))
                                    .rounded_tr(px(w / 2.0 - 6.0))
                            },
                        )),
                )
                .child(caption),
        );
    }

    let mut intro = index
        .intro
        .split("\n\n")
        .map(str::trim)
        .filter(|p| !p.is_empty());
    if let Some(first) = intro.next() {
        col = col.child(
            div()
                .flex()
                .flex_col()
                .gap(px(10.))
                .child(
                    div()
                        .font_family(theme::SCRIPT)
                        .text_size(px(40.))
                        .line_height(px(56.))
                        .child(first.to_string()),
                )
                .children(intro.map(|p| {
                    div()
                        .text_size(px(20.))
                        .line_height(px(32.))
                        .child(p.to_string())
                })),
        );
    }

    let latest = |slug: &str| {
        index
            .items
            .iter()
            .filter(|i| i.section == slug)
            .filter_map(|i| i.published_at.clone())
            .max()
    };
    let mut sections: Vec<_> = index.sections.iter().filter(|s| s.count > 0).collect();
    sections.sort_by(|a, b| latest(&b.slug).cmp(&latest(&a.slug)));
    let mut panels = div().flex().flex_wrap().gap(px(28.));
    for s in sections {
        let mut items: Vec<_> = index.items.iter().filter(|i| i.section == s.slug).collect();
        items.sort_by(|a, b| b.published_at.cmp(&a.published_at));
        let key = SharedString::from(format!("deck:{}", s.slug));
        panels = panels.child(
            div()
                .flex_1()
                .min_w(px(260.))
                .flex()
                .flex_col()
                .gap(px(8.))
                .child(
                    column_head(
                        &s.name.to_lowercase(),
                        s.count as usize,
                        &format!("/{}", s.slug),
                        &key,
                        nav,
                        &t,
                    )
                    .text_color(t.section(&s.slug)),
                )
                .children(items.into_iter().take(3).enumerate().map(|(i, it)| {
                    div()
                        .flex()
                        .items_baseline()
                        .justify_between()
                        .gap(px(12.))
                        .child(
                            content::link((key.clone(), i), &it.title, &it.href, nav, &t)
                                .italic()
                                .text_size(px(18.)),
                        )
                        .child(
                            div()
                                .flex_none()
                                .font_family(theme::SANS)
                                .text_size(px(11.))
                                .text_color(t.muted)
                                .child(
                                    it.published_at
                                        .as_deref()
                                        .map(crate::content::fmt_date_short)
                                        .unwrap_or_default()
                                        .to_uppercase(),
                                ),
                        )
                }))
                .child(
                    content::link(
                        (key.clone(), 99usize),
                        &format!("all {} →", s.count),
                        &format!("/{}", s.slug),
                        nav,
                        &t,
                    )
                    .font_family(theme::SANS)
                    .text_size(px(14.)),
                ),
        );
    }
    col.child(panels).into_any_element()
}

fn note_title(excerpt: &str) -> String {
    let words = excerpt.split_whitespace().collect::<Vec<_>>().join(" ");
    if words.is_empty() {
        return "A photograph".into();
    }
    if words.chars().count() <= 72 {
        return words;
    }
    let cut: String = words.chars().take(72).collect();
    format!("{}…", cut.rsplit_once(' ').map(|(a, _)| a).unwrap_or(&cut))
}

pub fn note_line(excerpt: &str, created_at: &str) -> String {
    if excerpt.split_whitespace().next().is_some() {
        note_title(excerpt)
    } else {
        format!("Photograph, {}", crate::content::fmt_date_short(created_at))
    }
}

fn column_head(
    name: &str,
    count: usize,
    href: &str,
    key: &str,
    nav: &Navigate,
    t: &Theme,
) -> gpui::Div {
    div()
        .flex()
        .items_baseline()
        .gap(px(8.))
        .pb(px(6.))
        .border_b_1()
        .border_color(t.rule)
        .child(
            content::link(
                SharedString::from(format!("{key}:head")),
                name,
                href,
                nav,
                t,
            )
            .font_family(theme::SCRIPT)
            .text_size(px(26.))
            .line_height(px(38.)),
        )
        .child(
            div()
                .font_family(theme::SANS)
                .text_size(px(13.))
                .text_color(t.muted)
                .child(count.to_string()),
        )
}

pub fn list(
    index: &Index,
    home: &Home,
    nav: &Navigate,
    theme: &Theme,
    window: &gpui::Window,
) -> AnyElement {
    let t = *theme;
    let q = home.query.trim().to_lowercase();
    let mut col = div()
        .w_full()
        .max_w(px(880.))
        .mx_auto()
        .flex()
        .flex_col()
        .gap(px(28.));
    if home.section.is_none() && q.is_empty() {
        col = col.child(deck(index, nav, theme, window)).child(
            div().pt(px(12.)).child(
                div()
                    .font_family(theme::SCRIPT)
                    .text_size(px(30.))
                    .line_height(px(44.))
                    .child("Everything, newest first"),
            ),
        );
    }
    let mut any = false;
    struct Entry {
        title: String,
        href: String,
        section: String,
        date: String,
    }
    let mut entries: Vec<Entry> = index
        .items
        .iter()
        .filter(|i| home.section.as_deref().is_none_or(|x| x == i.section))
        .filter(|i| matches_query(i, &q))
        .map(|i| Entry {
            title: i.title.clone(),
            href: i.href.clone(),
            section: i.section.clone(),
            date: i.published_at.clone().unwrap_or_default(),
        })
        .collect();
    if home.section.is_none() {
        entries.extend(
            index
                .feed
                .iter()
                .map(|f| Entry {
                    title: note_line(&f.excerpt, &f.created_at),
                    href: f.href.clone(),
                    section: "feed".into(),
                    date: f.created_at.clone(),
                })
                .filter(|e| q.is_empty() || e.title.to_lowercase().contains(&q)),
        );
    }
    entries.sort_by(|a, b| b.date.cmp(&a.date));
    let name_of = |slug: &str| {
        if slug == "feed" {
            "Feed".to_string()
        } else {
            index
                .sections
                .iter()
                .find(|s| s.slug == slug)
                .map(|s| s.name.clone())
                .unwrap_or_default()
        }
    };
    let mut years: Vec<(String, Vec<Entry>)> = Vec::new();
    for e in entries {
        let y = e
            .date
            .get(..4)
            .filter(|y| !y.is_empty())
            .unwrap_or("Undated")
            .to_string();
        match years.last_mut() {
            Some((last, list)) if *last == y => list.push(e),
            _ => years.push((y, vec![e])),
        }
    }
    for (year, list) in years {
        any = true;
        let key = SharedString::from(format!("y{year}"));
        col = col.child(
            div()
                .flex()
                .flex_col()
                .gap(px(6.))
                .child(
                    div()
                        .font_family(theme::SANS)
                        .font_weight(gpui::FontWeight::MEDIUM)
                        .text_size(px(13.))
                        .letter_spacing(px(1.2))
                        .text_color(t.accent)
                        .border_b_1()
                        .border_color(t.rule)
                        .pb(px(6.))
                        .child(year),
                )
                .children(list.into_iter().enumerate().map(|(i, it)| {
                    div()
                        .flex()
                        .items_baseline()
                        .justify_between()
                        .gap(px(16.))
                        .py(px(2.))
                        .child(
                            div()
                                .min_w_0()
                                .font_family(theme::SCRIPT)
                                .text_size(px(19.))
                                .line_height(px(32.))
                                .child(content::link(
                                    (key.clone(), i),
                                    &it.title,
                                    &it.href,
                                    nav,
                                    &t,
                                )),
                        )
                        .child(
                            div()
                                .flex_none()
                                .flex()
                                .items_center()
                                .gap(px(10.))
                                .font_family(theme::SANS)
                                .text_size(px(11.))
                                .letter_spacing(px(1.0))
                                .text_color(t.section(&it.section))
                                .child(name_of(&it.section).to_uppercase())
                                .child(
                                    div()
                                        .w(px(44.))
                                        .text_color(t.muted)
                                        .child(it.date.get(5..10).unwrap_or("").replace('-', "·")),
                                ),
                        )
                })),
        );
    }
    if !any {
        col = col.child(
            div()
                .italic()
                .text_color(t.muted)
                .child(format!("No titles match “{}”.", home.query.trim())),
        );
    }
    div()
        .id("home-list")
        .occlude()
        .font_family(theme::BODY)
        .absolute()
        .inset_0()
        .bg(t.paper)
        .overflow_y_scroll()
        .px(px(20.))
        .pt(px(84. + crate::browser::safe_insets()[0]))
        .pb(px(60.))
        .child(col)
        .into_any_element()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn find_lists_title_and_tag_matches_then_what_the_meaning_adds() {
        let mut index: Index = serde_json::from_str(
            r#"{"items": [
                {"title": "Glass", "href": "/posts/glass", "section": "posts", "tags": ["Photography"]},
                {"title": "Pizza Dough", "href": "/recipes/dough", "section": "recipes"}
            ], "feed": [{"rkey": "3k", "href": "/feed/3k", "excerpt": "  A walk by   the river ", "createdAt": "2024-05-01T10:00:00Z"}]}"#,
        )
        .unwrap();
        index.prepare_search();
        let hit = |href: &str, title: &str| Hit {
            href: href.into(),
            title: title.into(),
        };
        let by_meaning = [
            hit("/posts/glass", "Glass"),
            hit("/feed/3k", "feed"),
            hit("/art/kiln", "Kiln"),
        ];
        let home = Home {
            query: " photo".into(),
            ..Default::default()
        };
        let pair = |title: &str, href: &str| (title.to_string(), href.to_string());
        assert_eq!(
            home.results(Some(&index), &by_meaning),
            [
                pair("Glass", "/posts/glass"),
                pair("A walk by the river", "/feed/3k"),
                pair("Kiln", "/art/kiln"),
            ]
        );
        assert_eq!(
            home.results(None, &by_meaning[1..]),
            [pair("feed", "/feed/3k"), pair("Kiln", "/art/kiln")]
        );
        assert_eq!(
            home.results(Some(&index), &[]),
            [pair("Glass", "/posts/glass")]
        );
    }
}
