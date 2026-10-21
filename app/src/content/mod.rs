//! Route payloads → GPUI elements. Each route kind gets its own native layout;
//! the plate draws the frame around whatever this returns.
//!
//! - `md`: markdown → block tree (pure, tested), `recipe` and `series` likewise
//! - `cache`: one parse per payload
//! - `render`, `media`, `series_view`, `recipe_view`, `recipe_steps`: blocks → elements
//! - `pages`: the per-route layouts; `special`: now, resume, developers
//! - `feed`: the feed's endless scroll; `toc`: a document's contents
//! - `lightbox`: a figure's image over the whole window
//! - `terrazzo`: a record's banner; `diagram`: Mermaid syntax, drawn by pele in the browser
//! - `near`: images decoded only near the screen; `state`: view-local state by element id
//! - `scope`: everything the page showing keeps outside GPUI, dropped together on the next payload
//! - `fixtures` (tests only): payloads built from hand-written and real markdown

mod cache;
pub mod diagram;
mod feed;
#[cfg(test)]
pub(crate) mod fixtures;
mod lightbox;
mod md;
pub mod media;
pub mod near;
mod pages;
mod recipe;
mod recipe_steps;
mod recipe_view;
mod render;
mod series;
mod series_view;
mod special;

pub use media::parse_color;
pub use pages::{encode_segment, fmt_date_short};
pub use render::label;
mod scope;
mod state;
mod terrazzo;
mod toc;

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, FontWeight, Window, div};

use crate::api::{Navigate, RoutePayload};
use crate::design;
use crate::theme::{self, Theme};

/// The page body for a route. `nav` opens site paths in place and anything else in a new tab.
pub fn view(
    payload: &RoutePayload,
    nav: &Navigate,
    theme: &Theme,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    state::set_page_view(window.current_view());
    crate::dom_video::begin_render();
    let body = body(payload, nav, theme, window, cx);
    match lightbox::overlay(theme, window, cx) {
        Some(overlay) => div()
            .flex()
            .flex_col()
            .w_full()
            .child(body)
            .child(overlay)
            .into_any_element(),
        None => body,
    }
}

fn body(
    payload: &RoutePayload,
    nav: &Navigate,
    theme: &Theme,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    match payload {
        RoutePayload::Doc { doc } => pages::doc(doc, nav, theme, window, cx),
        RoutePayload::Page {
            slug,
            title,
            markdown,
        } => pages::page(slug, title, markdown, nav, theme, window, cx),
        RoutePayload::List {
            section,
            items,
            paging,
        } => pages::section_listing(section, items, paging, nav, theme),
        RoutePayload::Content {
            items,
            paging,
            sections,
        } => pages::content_listing(items, sections, paging, nav, theme),
        RoutePayload::Tag { tag, items, paging } => {
            pages::tag_listing(tag, items, paging, nav, theme)
        }
        RoutePayload::Tags { tags, .. } => pages::tags(tags, nav, theme),
        RoutePayload::Feed { posts, paging } => pages::feed(posts, paging, nav, theme, window, cx),
        RoutePayload::Post { post } => pages::post(post, nav, theme, window, cx),
        RoutePayload::Now(n) => special::now(n, nav, theme, window, cx),
        RoutePayload::Resume { title, sections } => special::resume(title, sections, nav, theme),
        RoutePayload::Developers(d) => special::developers(d, nav, theme, window, cx),
        RoutePayload::NotFound => pages::not_found(nav, theme),
        RoutePayload::Home | RoutePayload::Redirect { .. } => div().into_any_element(),
    }
}

/// A new page is in: let go of what the last one kept outside GPUI (`scope`), and let its
/// parsed trees age out of the cache.
pub fn forget_page() {
    scope::reset();
    cache::next_page();
}

/// The reading column every content page shares.
pub fn column(theme: &Theme) -> gpui::Div {
    div()
        .w_full()
        .max_w(px(design::COLUMN_MAX_W))
        .mx_auto()
        .flex()
        .flex_col()
        .gap(px(16.))
        .font_family(theme::BODY)
        .text_size(px(design::BODY_SIZE))
        .line_height(px(design::BODY_LEADING))
        .text_color(theme.ink)
}

pub fn heading(text: &str, theme: &Theme) -> impl IntoElement {
    div()
        .font_family(theme::DISPLAY)
        .text_size(px(34.))
        .line_height(px(40.))
        .font_weight(FontWeight::NORMAL)
        .text_color(theme.ink)
        .child(text.to_string())
}

/// A text link: the accent on hover, same-tab for site paths.
pub fn link(
    id: impl Into<gpui::ElementId>,
    label: &str,
    href: &str,
    nav: &Navigate,
    theme: &Theme,
) -> gpui::Stateful<gpui::Div> {
    let nav = nav.clone();
    let href = href.to_string();
    let label = label.to_string();
    let accent = theme.accent;
    div()
        .id(id)
        .cursor_pointer()
        .text_color(theme.ink)
        .hover(move |s| s.text_color(accent))
        .child(label)
        .on_click(move |_, window, cx| nav(href.clone(), window, cx))
}
