//! The feed scrolls on without end: a probe under the last post watches for the bottom of
//! the page coming near and fetches the next page of posts, which are appended here (the
//! route's own payload stays as it arrived).

use std::rc::Rc;

use gpui::prelude::*;
use gpui::{AnyElement, App, div};

use crate::api::{Paging, Post, RoutePayload};
use crate::theme::Theme;
use gpui::px;

use super::render::{double_rule, label};
use super::{scope, state};

/// How close (in window pixels) the end of the list must come before the next page is asked for.
const AHEAD: f32 = 900.;

pub(super) struct More {
    /// which listing this continues (the first post of the page it started from), so a page
    /// landing after the reader has left is dropped
    from: String,
    /// every post already shown (the route's own page, then each page added), so a page that
    /// shifted under a new post never repeats one
    seen: std::collections::HashSet<String>,
    posts: Vec<Rc<Post>>,
    next: u32,
    pages: u32,
    loading: bool,
    failed: bool,
}

/// Where the list stands below the posts it has.
pub enum Tail {
    Loading,
    Failed,
    More,
    End,
}

/// The posts loaded after the route's own page, and where the list stands.
pub fn extra(posts: &[Post], paging: &Paging) -> (Vec<Rc<Post>>, Tail) {
    let Paging { page, pages, .. } = *paging;
    scope::with(
        |p| &p.more,
        |m| {
            let mut m = m.borrow_mut();
            let m = m.get_or_insert_with(|| More {
                from: posts.first().map(|p| p.rkey.clone()).unwrap_or_default(),
                seen: posts.iter().map(|p| p.rkey.clone()).collect(),
                posts: Vec::new(),
                next: page.max(1) + 1,
                pages,
                loading: false,
                failed: false,
            });
            let tail = if m.loading {
                Tail::Loading
            } else if m.failed {
                Tail::Failed
            } else if m.next <= m.pages {
                Tail::More
            } else {
                Tail::End
            };
            (m.posts.clone(), tail)
        },
    )
}

/// Fetch the next page now (unless one is already on its way or there are no more).
fn fetch(cx: &mut App) {
    let next = scope::with(
        |p| &p.more,
        |m| {
            let mut m = m.borrow_mut();
            let m = m.as_mut()?;
            if m.loading || m.next > m.pages {
                return None;
            }
            m.loading = true;
            m.failed = false;
            Some((m.next, m.from.clone()))
        },
    );
    let Some((next, from)) = next else { return };
    use crate::http;
    let fetch = http::get_json::<RoutePayload>(
        cx.http_client(),
        http::route_url(&format!("/feed/page/{next}")),
        http::Retry::ONCE,
        cx.background_executor().clone(),
    );
    cx.spawn(async move |cx| {
        let result = fetch.await;
        scope::with(
            |p| &p.more,
            |m| {
                let mut m = m.borrow_mut();
                let Some(m) = m.as_mut().filter(|m| m.from == from) else {
                    return; // the reader has moved on to another listing
                };
                m.loading = false;
                match result {
                    Ok(RoutePayload::Feed { posts, paging }) => {
                        let fresh: Vec<Post> = posts
                            .into_iter()
                            .filter(|p| !m.seen.contains(&p.rkey))
                            .collect();
                        m.seen.extend(fresh.iter().map(|p| p.rkey.clone()));
                        m.posts.extend(fresh.into_iter().map(Rc::new));
                        m.next = next + 1;
                        m.pages = paging.pages;
                    }
                    _ => m.failed = true,
                }
            },
        );
        cx.update(|cx| state::redraw_page(cx));
    })
    .detach();
}

/// What sits under the last post: a probe that asks for more as the end nears, and a word
/// on where the list stands.
pub fn tail(tail: Tail, theme: &Theme) -> AnyElement {
    let probe = div().absolute().inset_0().child(
        gpui::canvas(
            |bounds, window, cx| {
                let top: f32 = bounds.origin.y.into();
                let view = window.content_mask().bounds;
                let bottom: f32 = (view.origin.y + view.size.height).into();
                if top < bottom + AHEAD {
                    fetch(cx);
                }
            },
            |_, _, _, _| {},
        )
        .size_full(),
    );
    let accent = theme.accent;
    let note = match tail {
        Tail::Loading | Tail::More => div()
            .italic()
            .text_color(theme.muted)
            .child("More notes are on their way…")
            .into_any_element(),
        Tail::Failed => div()
            .id("feed:retry")
            .cursor_pointer()
            .italic()
            .text_color(theme.ink)
            .hover_style(move |s| s.text_color(accent))
            .child("The next notes would not load. Try again →")
            .on_click(|_, _, cx| fetch(cx))
            .into_any_element(),
        Tail::End => div()
            .flex()
            .flex_col()
            .items_center()
            .gap(px(8.))
            .child(double_rule(theme, 48.))
            .child(label("THE FIRST NOTE", theme.muted))
            .into_any_element(),
    };
    let auto = matches!(tail, Tail::More);
    div()
        .relative()
        .pt(px(10.))
        .flex()
        .justify_center()
        .text_size(px(16.))
        .child(note)
        .when(auto, |d| d.child(probe))
        .into_any_element()
}
