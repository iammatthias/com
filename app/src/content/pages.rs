//! One native layout per route kind: the document, listings, the feed, tags, plain pages, 404.

use std::collections::HashMap;
use std::rc::Rc;
use std::sync::LazyLock;

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{
    Doc, Item, Media, Navigate, Paging, Post, RelatedRef, SectionRef, Series, TagCount,
};
use crate::design;
use crate::select::Selection;
use crate::theme::{self, Theme};

use super::cache::{self, Parsed};
use super::md::Block;
use super::media;
use super::render::{self, Ctx, alpha, double_rule, hairline, label};
use super::{column, link};

static NO_MEDIA: LazyLock<HashMap<String, Media>> = LazyLock::new(HashMap::new);
static NO_SERIES: LazyLock<HashMap<String, Series>> = LazyLock::new(HashMap::new);

/// A body of markdown and what it draws from.
struct Prose<'a> {
    /// the record's cid, when it has one (see `cache::parsed`)
    identity: Option<&'a str>,
    markdown: &'a str,
    media: &'a HashMap<String, Media>,
    series: &'a HashMap<String, Series>,
}

impl<'a> Prose<'a> {
    fn doc(doc: &'a Doc) -> Self {
        Self {
            identity: Some(&doc.cid),
            markdown: &doc.markdown,
            media: &doc.media,
            series: &doc.series,
        }
    }

    fn post(post: &'a Post) -> Self {
        Self {
            identity: None,
            markdown: &post.body,
            media: &post.media,
            series: &post.series,
        }
    }

    /// Markdown with no media or series of its own.
    fn text(markdown: &'a str) -> Self {
        Self {
            identity: None,
            markdown,
            media: &NO_MEDIA,
            series: &NO_SERIES,
        }
    }

    /// Its tree (parsed once per payload), and a context drawing it across the reading column.
    fn of(
        self,
        theme: &'a Theme,
        nav: &'a Navigate,
        sel: &Selection,
        key: impl Into<SharedString>,
        window: &Window,
    ) -> (Rc<Parsed>, Ctx<'a>) {
        let parsed = cache::parsed(self.identity, self.markdown, self.media, self.series);
        let ctx = Ctx::new(
            theme,
            nav,
            sel,
            self.media,
            parsed.clone(),
            measure(window),
            window.scale_factor(),
            key,
        );
        (parsed, ctx)
    }
}

/// Reading column width for this window: `COLUMN_MAX_W`, or less on a narrow screen.
pub fn measure(window: &Window) -> f32 {
    // page.rs pads the scroller 48 px a side (22 on a phone); what's left is the column, capped
    // at `COLUMN_MAX_W`
    let vw: f32 = f32::from(window.viewport_size().width);
    let pad = if vw < design::PHONE_W { 44. } else { 96. };
    (vw - pad).clamp(240., design::COLUMN_MAX_W)
}

const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

/// `2026-10-02T02:01:14Z` → `2 October 2026`.
pub fn fmt_date(iso: &str) -> String {
    let d = iso.get(..10).unwrap_or(iso);
    let mut parts = d.split('-');
    let (Some(y), Some(m), Some(day)) = (parts.next(), parts.next(), parts.next()) else {
        return d.to_string();
    };
    let (Ok(m), Ok(day)) = (m.parse::<usize>(), day.parse::<u32>()) else {
        return d.to_string();
    };
    match MONTHS.get(m.wrapping_sub(1)) {
        Some(name) => format!("{day} {name} {y}"),
        None => d.to_string(),
    }
}

/// `2026-10-02…` → `2 Oct 2026` for list margins.
pub fn fmt_date_short(iso: &str) -> String {
    let long = fmt_date(iso);
    let mut words: Vec<String> = long.split(' ').map(str::to_string).collect();
    if words.len() == 3 {
        words[1] = words[1].chars().take(3).collect();
    }
    words.join(" ")
}

/// Percent-encode one path segment (tags may carry spaces or punctuation). `site::encode`
/// encodes a whole path with it, segment by segment.
pub fn encode_segment(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/// At most `n` characters, cut at a word with an ellipsis.
pub(super) fn clip(s: &str, n: usize) -> String {
    let s = s.trim();
    if s.chars().count() <= n {
        return s.to_string();
    }
    let cut: String = s.chars().take(n).collect();
    let cut = cut.rsplit_once(' ').map_or(cut.as_str(), |(a, _)| a);
    format!("{}…", cut.trim_end_matches([',', ';', ':', '.']))
}

pub fn page_href(base: &str, page: u32) -> String {
    if page <= 1 {
        base.to_string()
    } else {
        format!("{}/page/{page}", base.trim_end_matches('/'))
    }
}

/// A page's title: Newsreader, large, the same on every kind of page (the script belongs to
/// the plate).
fn display_title(text: &str, theme: &Theme) -> gpui::Div {
    div()
        .font_family(theme::DISPLAY)
        .text_size(px(design::TITLE_SIZE))
        .line_height(px(design::TITLE_LEADING))
        .letter_spacing(px(-0.6))
        .text_color(theme.ink)
        .child(text.to_string())
}

pub(super) fn script_title(text: &str, theme: &Theme) -> gpui::Div {
    display_title(text, theme)
}

/// Tags as small rounded chips: `# ai`.
fn tag_chips(tags: &[String], key: &str, nav: &Navigate, theme: &Theme) -> AnyElement {
    let mut row = div().flex().flex_wrap().gap(px(6.));
    for (i, t) in tags.iter().enumerate() {
        let (accent, nav) = (theme.accent, nav.clone());
        let href = format!("/tags/{}", encode_segment(t));
        row = row.child(
            div()
                .id(SharedString::from(format!("{key}:chip{i}")))
                .cursor_pointer()
                .flex()
                .items_center()
                .gap(px(3.))
                .px(px(10.))
                .py(px(3.))
                .rounded_full()
                .border_1()
                .border_color(theme.edge())
                .font_family(theme::SANS)
                .text_size(px(13.))
                .line_height(px(18.))
                .text_color(theme.ink)
                .hover(move |s| s.text_color(accent).border_color(accent))
                .child(div().text_color(theme.muted).child("#"))
                .child(t.clone())
                .on_click(move |_, window, cx| nav(href.clone(), window, cx)),
        );
    }
    row.into_any_element()
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
                .hover(move |s| s.text_color(accent))
                .child(t.to_lowercase())
                .on_click(move |_, window, cx| nav(href.clone(), window, cx)),
        );
    }
    row.into_any_element()
}

/// Drop a leading `# Title` that repeats the document title (the twins carry one).
fn body_blocks<'a>(blocks: &'a [Block], title: &str) -> &'a [Block] {
    match blocks.first() {
        Some(Block::Heading { level: 1, text })
            if text.text.trim().eq_ignore_ascii_case(title.trim()) =>
        {
            &blocks[1..]
        }
        _ => blocks,
    }
}

// ---------------------------------------------------------------------------------------------

pub fn doc(
    doc: &Doc,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let key = if doc.cid.is_empty() {
        doc.href.clone()
    } else {
        doc.cid.clone()
    };
    let (parsed, ctx) = Prose::doc(doc).of(theme, nav, sel, key.clone(), window);
    let width = ctx.width;

    let minutes = doc
        .reading_minutes
        .unwrap_or_else(|| (parsed.words as f32 / 230.).ceil().max(1.) as u32);

    // the header: where it was published (in that section's colour) and when, the title, the
    // standfirst, its tags; then one hairline, the contents, and the text
    let mut kicker = div()
        .flex()
        .flex_wrap()
        .items_center()
        .gap_x(px(10.))
        .gap_y(px(4.));
    if !doc.section.name.is_empty() {
        kicker = kicker.child(
            link(
                SharedString::from(format!("{key}:section")),
                &doc.section.name.to_uppercase(),
                &format!("/{}", doc.section.slug),
                nav,
                theme,
            )
            .font_family(theme::SANS)
            .font_weight(gpui::FontWeight::MEDIUM)
            .text_size(px(design::LABEL_SIZE))
            .line_height(px(design::LABEL_LEADING))
            .letter_spacing(px(design::LABEL_TRACKING))
            .text_color(theme.section(&doc.section.slug)),
        );
    }
    let mut meta = Vec::new();
    if let Some(p) = doc.published_at.as_deref() {
        meta.push(fmt_date(p).to_uppercase());
    }
    meta.push(format!("{minutes} MIN READ"));
    for m in meta {
        kicker = kicker
            .child(
                div()
                    .size(px(3.))
                    .rounded_full()
                    .bg(alpha(theme.muted, 0.6)),
            )
            .child(label(m, theme.muted));
    }

    let mut head = div()
        .flex()
        .flex_col()
        .gap(px(14.))
        .child(kicker)
        .child(display_title(&doc.title, theme));
    if let Some(desc) = doc
        .description
        .as_deref()
        .map(str::trim)
        .filter(|d| !d.is_empty())
    {
        head = head.child(
            div()
                .italic()
                .text_size(px(22.))
                .line_height(px(32.))
                .text_color(alpha(theme.ink, 0.72))
                .child(desc.to_string()),
        );
    }
    if !doc.tags.is_empty() {
        head = head.child(
            div()
                .pt(px(2.))
                .child(tag_chips(&doc.tags, &key, nav, theme)),
        );
    }

    let mut col = column(theme)
        .gap(px(22.))
        .child(head)
        .child(hairline(theme));
    let body = body_blocks(&parsed.blocks, &doc.title);
    let contents = super::toc::entries(body, &doc.section.slug);
    if !contents.is_empty() {
        col = col.child(super::toc::view(&contents, &key, theme));
    }
    col = col
        .child(render::stack(body, &ctx, window, cx))
        .child(div().pt(px(24.)).child(double_rule(theme, 64.)))
        .child(terrazzo_banner(&doc.rkey, &doc.cid, width, window, cx))
        .child(colophon(doc, &key, nav, theme));
    if !doc.related.is_empty() {
        col = col.child(related(&doc.related, &key, nav, theme));
    }
    if doc.prev.is_some() || doc.next.is_some() {
        col = col.child(prev_next(
            doc.prev.as_ref(),
            doc.next.as_ref(),
            &key,
            nav,
            theme,
        ));
    }
    col.into_any_element()
}

/// The record's terrazzo, as @com draws it at the foot of every record: seeded by
/// `<rkey>:<cid>`, so each keeps the pattern it had there.
fn terrazzo_banner(
    rkey: &str,
    cid: &str,
    width: f32,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    if rkey.is_empty() || cid.is_empty() {
        return div().into_any_element();
    }
    let height = if f32::from(window.viewport_size().width) < design::BANNER_SMALL_W {
        96.0
    } else {
        140.0
    };
    let seed = crate::seed::hash(&format!("{rkey}:{cid}"));
    let (image, evicted) = super::terrazzo::banner(seed, width, height, window.scale_factor());
    if let Some(old) = evicted {
        let _ = cx.drop_image(old, Some(window));
    }
    div()
        .w(px(width))
        .h(px(height))
        .rounded(px(10.))
        .overflow_hidden()
        .child(gpui::img(gpui::ImageSource::Render(image)).size_full())
        .into_any_element()
}

fn colophon(doc: &Doc, key: &str, nav: &Navigate, theme: &Theme) -> AnyElement {
    let row = |k: &str, v: AnyElement| {
        div()
            .flex()
            .items_center()
            .gap(px(14.))
            .child(
                div()
                    .w(px(110.))
                    .flex_none()
                    .child(label(k.to_uppercase(), theme.muted)),
            )
            .child(div().flex_1().min_w_0().child(v))
            .into_any_element()
    };
    let text = |s: String| div().italic().child(s).into_any_element();
    let mut col = div()
        .flex()
        .flex_col()
        .gap(px(4.))
        .text_size(px(16.))
        .line_height(px(24.))
        .child(label("COLOPHON", theme.accent).pb(px(6.)));
    if !doc.section.name.is_empty() {
        col = col.child(row("Section", text(doc.section.name.clone())));
    }
    if let Some(p) = doc.published_at.as_deref() {
        col = col.child(row("Published", text(fmt_date(p))));
    }
    if let Some(u) = doc.updated_at.as_deref() {
        if Some(u.get(..10)) != doc.published_at.as_deref().map(|p| p.get(..10)) {
            col = col.child(row("Updated", text(fmt_date(u))));
        }
    }
    if !doc.cid.is_empty() {
        col = col.child(row(
            "Record",
            div()
                .font_family(theme::MONO)
                .text_size(px(12.5))
                .text_color(alpha(theme.ink, 0.8))
                .whitespace_nowrap()
                .overflow_hidden()
                .text_ellipsis_middle()
                .child(doc.cid.clone())
                .into_any_element(),
        ));
    }
    if !doc.href.is_empty() {
        let twin = format!("{}.md", doc.href.trim_end_matches('/'));
        let accent = theme.accent;
        let open = twin.clone();
        col = col.child(row(
            "Source",
            div()
                .id(SharedString::from(format!("{key}:twin")))
                .cursor_pointer()
                .flex()
                .items_baseline()
                .gap(px(6.))
                .text_color(theme.ink)
                .hover(move |s| s.text_color(accent))
                .child(
                    div()
                        .min_w_0()
                        .font_family(theme::MONO)
                        .text_size(px(12.5))
                        .whitespace_nowrap()
                        .overflow_hidden()
                        .text_ellipsis_start()
                        .child(crate::route::to_path(&twin)),
                )
                .child(div().flex_none().text_color(theme.accent).child("→"))
                .on_click(move |_, _, _| crate::route::open_external(&open))
                .into_any_element(),
        ));
    }
    let _ = nav;
    col.into_any_element()
}

fn related(items: &[RelatedRef], key: &str, nav: &Navigate, theme: &Theme) -> AnyElement {
    // as @com's cards: title, kind in its colour, date, the first lines of the description
    div()
        .flex()
        .flex_col()
        .gap(px(12.))
        .pt(px(10.))
        .child(hairline(theme))
        .child(label("RELATED", theme.accent).pt(px(8.)))
        .children(items.iter().enumerate().map(|(i, r)| {
            let kind = r.section.clone().unwrap_or_default();
            div()
                .flex()
                .flex_col()
                .gap(px(2.))
                .child(
                    div()
                        .flex()
                        .items_baseline()
                        .justify_between()
                        .gap(px(16.))
                        .child(
                            link(
                                SharedString::from(format!("{key}:rel{i}")),
                                &r.title,
                                &r.href,
                                nav,
                                theme,
                            )
                            .italic()
                            .text_size(px(19.)),
                        )
                        .child(
                            div()
                                .flex_none()
                                .flex()
                                .items_baseline()
                                .gap(px(10.))
                                .when(!kind.is_empty(), |d| {
                                    d.child(
                                        label(kind.to_uppercase(), theme.section(&kind))
                                            .text_size(px(design::LABEL_SIZE)),
                                    )
                                })
                                .when_some(
                                    r.published_at.as_deref().map(fmt_date_short),
                                    |d, date| {
                                        d.child(
                                            label(date.to_uppercase(), theme.muted)
                                                .text_size(px(design::LABEL_SIZE)),
                                        )
                                    },
                                ),
                        ),
                )
                .when_some(
                    r.description.clone().filter(|d| !d.trim().is_empty()),
                    |d, desc| {
                        d.child(
                            div()
                                .text_size(px(15.))
                                .line_height(px(22.))
                                .text_color(theme.muted)
                                .child(clip(&desc, 160)),
                        )
                    },
                )
        }))
        .into_any_element()
}

fn prev_next(
    prev: Option<&RelatedRef>,
    next: Option<&RelatedRef>,
    key: &str,
    nav: &Navigate,
    theme: &Theme,
) -> AnyElement {
    let side = |r: Option<&RelatedRef>, which: &str, right: bool| -> AnyElement {
        let Some(r) = r else {
            return div().flex_1().into_any_element();
        };
        let caption = if right {
            format!("{} →", which.to_uppercase())
        } else {
            format!("← {}", which.to_uppercase())
        };
        div()
            .flex_1()
            .flex()
            .flex_col()
            .gap(px(2.))
            .when(right, |d| d.items_end().text_right())
            .child(label(caption, theme.accent))
            .child(
                link(
                    SharedString::from(format!("{key}:{which}")),
                    &r.title,
                    &r.href,
                    nav,
                    theme,
                )
                .italic()
                .text_size(px(19.)),
            )
            .into_any_element()
    };
    div()
        .pt(px(12.))
        .flex()
        .flex_col()
        .gap(px(12.))
        .child(hairline(theme))
        .child(
            div()
                .flex()
                .gap(px(24.))
                .child(side(prev, "Previous", false))
                .child(side(next, "Next", true)),
        )
        .into_any_element()
}

// ---------------------------------------------------------------------------------------------
// listings

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

// ---------------------------------------------------------------------------------------------
// feed

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
    let (parsed, ctx) = Prose::post(post).of(theme, nav, sel, key.clone(), window);
    let width = ctx.width;

    let mut prose = Vec::new();
    let mut figures = Vec::new();
    for b in &parsed.blocks {
        match b {
            Block::Figure(f) => figures.push(f),
            other => prose.push(other),
        }
    }
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
            .children(
                prose
                    .into_iter()
                    .map(|b| render::block(b, &ctx, window, cx)),
            ),
    );
    match figures.len() {
        0 => {}
        1 => {
            col = col.child(media::figure(
                &figures[0].src,
                &figures[0].alt,
                width,
                single,
                &ctx,
            ))
        }
        _ => {
            let col_w = (width - 10.) / 2.;
            let tiles = figures
                .iter()
                .map(|f| {
                    (
                        media::aspect_of(&f.src, &ctx),
                        media::figure(&f.src, &f.alt, col_w, false, &ctx),
                    )
                })
                .collect();
            col = col.child(media::two_columns(tiles, width, 10.));
        }
    }
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
        ))
        .into_any_element()
}

// ---------------------------------------------------------------------------------------------

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
                .hover(move |s| s.text_color(accent))
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

/// A run of markdown laid out as the reading column lays out a page body.
pub(super) fn markdown(
    md: &str,
    key: &str,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let (parsed, ctx) = Prose::text(md).of(theme, nav, sel, key.to_string(), window);
    render::stack(&parsed.blocks, &ctx, window, cx).into_any_element()
}

pub fn page(
    slug: &str,
    title: &str,
    markdown: &str,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let (parsed, ctx) = Prose::text(markdown).of(theme, nav, sel, format!("page:{slug}"), window);
    let width = ctx.width;
    let title = if title.is_empty() { slug } else { title };
    column(theme)
        .gap(px(18.))
        .child(display_title(title, theme))
        .child(div().pb(px(6.)).child(double_rule(theme, width)))
        .child(render::stack(
            body_blocks(&parsed.blocks, title),
            &ctx,
            window,
            cx,
        ))
        .into_any_element()
}

pub fn not_found(nav: &Navigate, theme: &Theme) -> AnyElement {
    let go = |id: &str, text: &str, href: &str| {
        link(
            SharedString::from(format!("nf:{id}")),
            text,
            href,
            nav,
            theme,
        )
        .into_any_element()
    };
    column(theme)
        .gap(px(16.))
        .pt(px(40.))
        .child(label("404", theme.accent))
        .child(script_title("Not found", theme))
        .child(
            div()
                .text_size(px(18.))
                .child("That page doesn't exist — or it moved during the redesign."),
        )
        .child({
            // words and links in one wrapping line; punctuation rides on the link before it
            let with = |l: AnyElement, after: &str| {
                div()
                    .flex()
                    .items_baseline()
                    .child(l)
                    .child(after.to_string())
                    .into_any_element()
            };
            div()
                .flex()
                .flex_wrap()
                .items_baseline()
                .gap_x(px(5.))
                .text_size(px(18.))
                .child("Try the")
                .child(with(go("home", "homepage", "/"), ","))
                .child("browse")
                .child(go("content", "all content", "/content"))
                .child("or the")
                .child(with(go("feed", "feed", "/feed"), ","))
                .child("or wander the")
                .child(with(go("tags", "tag index", "/tags"), "."))
        })
        .into_any_element()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dates() {
        assert_eq!(fmt_date("2026-10-02T02:01:14Z"), "2 October 2026");
        assert_eq!(fmt_date_short("2024-03-09T16:43:00Z"), "9 Mar 2024");
        assert_eq!(fmt_date("soon"), "soon");
    }

    #[test]
    fn hrefs() {
        assert_eq!(page_href("/recipes", 1), "/recipes");
        assert_eq!(page_href("/recipes", 3), "/recipes/page/3");
        assert_eq!(encode_segment("apple intelligence"), "apple%20intelligence");
    }
}
