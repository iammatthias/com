//! Plain pages and the 404, and what every layout shares: a body of prose, the column's width, titles.

use std::collections::HashMap;
use std::rc::Rc;
use std::sync::LazyLock;

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{Doc, Media, Navigate, Post, Series};
use crate::design;
use crate::select::Selection;
use crate::theme::{self, Theme};

use super::cache::{self, Parsed};
use super::md::Block;
use super::render::{self, Ctx, double_rule, label};
use super::{column, link};

static NO_MEDIA: LazyLock<HashMap<String, Media>> = LazyLock::new(HashMap::new);
static NO_SERIES: LazyLock<HashMap<String, Series>> = LazyLock::new(HashMap::new);

/// A body of markdown and what it draws from.
pub(super) struct Prose<'a> {
    /// the record's cid, when it has one (see `cache::parsed`)
    identity: Option<&'a str>,
    markdown: &'a str,
    media: &'a HashMap<String, Media>,
    series: &'a HashMap<String, Series>,
    captions: bool,
}

impl<'a> Prose<'a> {
    pub(super) fn doc(doc: &'a Doc) -> Self {
        Self {
            identity: Some(&doc.cid),
            markdown: &doc.markdown,
            media: &doc.media,
            series: &doc.series,
            captions: true,
        }
    }

    pub(super) fn post(post: &'a Post, single: bool) -> Self {
        Self {
            identity: None,
            markdown: &post.body,
            media: &post.media,
            series: &post.series,
            captions: single,
        }
    }

    /// Markdown with no media or series of its own.
    pub(super) fn text(markdown: &'a str) -> Self {
        Self {
            identity: None,
            markdown,
            media: &NO_MEDIA,
            series: &NO_SERIES,
            captions: true,
        }
    }

    /// Its tree (parsed once per payload), and a context drawing it across the reading column.
    pub(super) fn of(
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
            self.captions,
            key,
        );
        (parsed, ctx)
    }
}

/// Reading column width for this window: `COLUMN_MAX_W`, or less on a narrow screen.
pub fn measure(window: &Window) -> f32 {
    let vw: f32 = f32::from(window.viewport_size().width);
    (vw - 2. * page_gutter(window)).clamp(240., design::COLUMN_MAX_W)
}

pub fn page_gutter(window: &Window) -> f32 {
    if design::is_phone(window) { 22. } else { 48. }
}

/// A page's title: Newsreader, large, the same on every kind of page (the script belongs to
/// the plate).
fn title(theme: &Theme) -> gpui::Div {
    div()
        .font_family(theme::DISPLAY)
        .text_size(px(design::TITLE_SIZE))
        .line_height(px(design::TITLE_LEADING))
        .letter_spacing(px(-0.6))
        .text_color(theme.ink)
}

/// A document's title, selectable with its body.
pub(super) fn display_title(text: &str, theme: &Theme, sel: &Selection) -> gpui::Div {
    title(theme).child(sel.text(text.to_string()))
}

pub(super) fn script_title(text: &str, theme: &Theme) -> gpui::Div {
    title(theme).child(text.to_string())
}

/// Drop a leading `# Title` that repeats the document title (the twins carry one).
pub(super) fn body_blocks<'a>(blocks: &'a [Block], title: &str) -> &'a [Block] {
    match blocks.first() {
        Some(Block::Heading { level: 1, text })
            if text.text.trim().eq_ignore_ascii_case(title.trim()) =>
        {
            &blocks[1..]
        }
        _ => blocks,
    }
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
        .child(display_title(title, theme, sel))
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
