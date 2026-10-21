//! A document's table of contents, as the old site built it (`DocArticle.astro`, `toc.ts`):
//! its h2/h3 headings when there are at least two, except in the art publication.
//!
//! A heading reports where it is painted (a probe in `render::heading`); a contents link
//! scrolls the page there. The page's scroll handle belongs to `page.rs`, so the jump is a
//! synthetic scroll-wheel event of exactly the right size, dispatched once the click is done.

use gpui::prelude::*;
use gpui::{
    AnyElement, App, Modifiers, PlatformInput, ScrollDelta, ScrollWheelEvent, SharedString,
    TouchPhase, Window, div, point,
};

use crate::theme::{self, Theme};
use gpui::px;

use super::md::Block;
use super::render::{alpha, label};
use super::scope;

#[derive(Clone, Debug, PartialEq)]
pub struct Entry {
    pub level: u8,
    pub text: String,
}

/// Publications whose documents never get contents (as on the old site).
const NO_TOC: [&str; 1] = ["art"];

/// The contents for a document's top-level blocks, or nothing if it doesn't merit any.
pub fn entries(blocks: &[Block], section: &str) -> Vec<Entry> {
    if NO_TOC.contains(&section) {
        return Vec::new();
    }
    let out: Vec<Entry> = blocks
        .iter()
        .filter_map(|b| match b {
            Block::Heading {
                level: level @ (2 | 3),
                text,
            } if !text.text.trim().is_empty() => Some(Entry {
                level: *level,
                text: text.text.trim().to_string(),
            }),
            _ => None,
        })
        .collect();
    if out.len() >= 2 { out } else { Vec::new() }
}

#[derive(Clone, Copy)]
pub(super) struct Spot {
    /// the heading's top in window pixels, this render
    top: f32,
    /// the top of what is visible of the page
    view_top: f32,
}

/// An invisible probe for a heading: remembers where it was painted this render.
pub fn probe(text: &str) -> impl IntoElement {
    let text = text.trim().to_string();
    div().absolute().inset_0().child(
        gpui::canvas(
            move |bounds, window, _| {
                let spot = Spot {
                    top: bounds.origin.y.into(),
                    view_top: window.content_mask().bounds.origin.y.into(),
                };
                scope::with(
                    |p| &p.toc,
                    |s| {
                        s.borrow_mut().insert(text.clone(), spot);
                    },
                );
            },
            |_, _, _, _| {},
        )
        .size_full(),
    )
}

/// Scroll the page so the heading `text` sits just under the top of the view.
fn jump(text: &str, window: &mut Window, cx: &mut App) {
    let Some(spot) = scope::with(|p| &p.toc, |s| s.borrow().get(text).copied()) else {
        return;
    };
    let by = spot.top - (spot.view_top + 24.);
    window.defer(cx, move |window, cx| {
        let event = ScrollWheelEvent {
            position: window.mouse_position(),
            delta: ScrollDelta::Pixels(point(gpui::px(0.), gpui::px(-by))),
            modifiers: Modifiers::default(),
            touch_phase: TouchPhase::Moved,
        };
        window.dispatch_event(PlatformInput::ScrollWheel(event), cx);
    });
}

/// The contents list: small capitals heading, one line per h2, h3s indented beneath.
pub fn view(entries: &[Entry], key: &str, theme: &Theme) -> AnyElement {
    let accent = theme.accent;
    let ink = theme.ink;
    let mut n = 0;
    div()
        .flex()
        .flex_col()
        .gap(px(2.))
        .px(px(18.))
        .py(px(14.))
        .rounded(px(14.))
        .bg(alpha(theme.ink, if theme.dark { 0.05 } else { 0.035 }))
        .child(label("CONTENTS", theme.muted).pb(px(6.)))
        .children(entries.iter().enumerate().map(|(i, e)| {
            let text = e.text.clone();
            let top = e.level <= 2;
            if top {
                n += 1;
            }
            div()
                .id(SharedString::from(format!("{key}:toc{i}")))
                .cursor_pointer()
                .flex()
                .items_baseline()
                .gap(px(12.))
                .when(!top, |d| d.pl(px(30.)))
                .font_family(theme::BODY)
                .text_size(px(if top { 17. } else { 16. }))
                .line_height(px(if top { 27. } else { 24. }))
                .text_color(if top { ink } else { alpha(ink, 0.75) })
                .hover(move |s| s.text_color(accent))
                .when(top, |d| {
                    d.child(
                        div()
                            .w(px(18.))
                            .flex_none()
                            .font_family(theme::SANS)
                            .text_size(px(12.))
                            .text_color(theme.muted)
                            .child(format!("{n:02}")),
                    )
                })
                .child(e.text.clone())
                .on_click(move |_, window, cx| jump(&text, window, cx))
        }))
        .into_any_element()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::content::md;

    #[test]
    fn needs_two_headings_and_not_art() {
        let blocks = md::parse("## One\n\ntext\n\n### Two\n\n#### Four\n");
        assert_eq!(entries(&blocks, "posts").len(), 2);
        assert!(entries(&blocks, "art").is_empty());
        assert!(entries(&md::parse("## Only\n"), "posts").is_empty());
    }
}
