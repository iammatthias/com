//! The lightbox: any figure's image, large, over a paper veil that covers the whole window.
//! Ported from the old site's `Lightbox.astro`: counter, prev/next, ←/→/Esc, close, swipe,
//! and a click on the veil closes it.
//!
//! The page is a scrolling, cached view, so the overlay is `deferred` (painted after
//! everything else) and `anchored` to the window's origin to escape the scroll container.
//! Its geometry is the window's, not the column's: window sizes are raw pixels, while type
//! and controls still go through the content scale.

use std::cell::RefCell;
use std::rc::Rc;

use gpui::prelude::*;
use gpui::{
    AnchoredPositionMode, AnyElement, App, FocusHandle, KeyDownEvent, MouseButton, MouseDownEvent,
    MouseUpEvent, ObjectFit, Pixels, Point, ScrollWheelEvent, StyledImage, TouchPhase, Window,
    anchored, deferred, div, img, point,
};

use crate::theme::{self, Theme};
use gpui::px;

use super::render::label;
use super::{scope, state};

/// One image the lightbox can show.
#[derive(Clone, Debug, PartialEq)]
pub struct Item {
    /// the big one (1920 or 2560 wide)
    pub large: String,
    /// what the page already loaded, shown while the big one arrives
    pub thumb: String,
    pub alt: String,
    pub aspect: f32,
}

/// The images of one rendered payload, in reading order. Filled while the page renders.
pub type Gallery = Rc<RefCell<Vec<Item>>>;

/// The width asked of the image proxy for the lightbox, by device pixel ratio and room:
/// a phone's screen is under 1280 device px across at 2×, and the decode is held in memory.
pub fn large_width(dpr: f32, phone: bool) -> u32 {
    if phone {
        1280
    } else if dpr > 1.5 {
        2560
    } else {
        1920
    }
}

pub(super) struct Open {
    /// the route it was opened on: navigating away closes it, home included (which keeps the
    /// last page up without a new payload, so the page scope isn't reset)
    path: String,
    items: Vec<Item>,
    index: usize,
    press: Option<Point<Pixels>>,
    /// horizontal travel of the current swipe or trackpad gesture
    swipe: f32,
    swiped: bool,
    last_wheel: Option<web_time::Instant>,
}

const FOCUS: &str = "lightbox:focus";
const SWIPE: f32 = 50.;

fn focus_handle(cx: &mut App) -> FocusHandle {
    state::slot(FOCUS, || None::<FocusHandle>, |h| h.clone()).unwrap_or_else(|| {
        let h = cx.focus_handle();
        state::slot(
            FOCUS,
            || None::<FocusHandle>,
            |slot| *slot = Some(h.clone()),
        );
        h
    })
}

/// Open the lightbox on image `index` of `gallery`.
pub fn open(gallery: &Gallery, index: usize, window: &mut Window, cx: &mut App) {
    let items = gallery.borrow().clone();
    if items.is_empty() {
        return;
    }
    let index = index.min(items.len() - 1);
    scope::with(
        |p| &p.lightbox,
        |o| {
            *o.borrow_mut() = Some(Open {
                path: crate::route::current(),
                items,
                index,
                press: None,
                swipe: 0.,
                swiped: false,
                last_wheel: None,
            })
        },
    );
    crate::overlay::set_lightbox(true);
    crate::dom_embed::hide_all();
    let h = focus_handle(cx);
    window.focus(&h, cx);
    window.refresh();
}

pub fn close(window: &mut Window) {
    scope::with(|p| &p.lightbox, |o| o.borrow_mut().take());
    crate::overlay::set_lightbox(false);
    window.refresh();
}

fn step(by: isize, window: &mut Window) {
    scope::with(
        |p| &p.lightbox,
        |o| {
            if let Some(open) = o.borrow_mut().as_mut() {
                let n = open.items.len() as isize;
                open.index = ((open.index as isize + by).rem_euclid(n)) as usize;
            }
        },
    );
    window.refresh();
}

/// The overlay, if the lightbox is open on this route.
pub fn overlay(theme: &Theme, window: &mut Window, cx: &mut App) -> Option<AnyElement> {
    let here = crate::route::current();
    let (item, index, count, neighbours) = scope::with(
        |p| &p.lightbox,
        |o| {
            let mut o = o.borrow_mut();
            if o.as_ref().is_some_and(|open| open.path != here) {
                *o = None;
                crate::overlay::set_lightbox(false);
            }
            let open = o.as_ref()?;
            let n = open.items.len();
            let neighbours: Vec<String> = if n > 1 {
                [open.index + 1, open.index + n - 1]
                    .iter()
                    .map(|i| open.items[i % n].large.clone())
                    .collect()
            } else {
                Vec::new()
            };
            Some((open.items[open.index].clone(), open.index, n, neighbours))
        },
    )?;

    let vp = window.viewport_size();
    let (vw, vh): (f32, f32) = (vp.width.into(), vp.height.into());
    let narrow = vw < 640.;
    // room for the arrows at the sides and the caption beneath, in window pixels
    let side = if narrow { 12. } else { 72. };
    let below = 84.;
    let top = 56.;
    let (aw, ah) = ((vw - side * 2.).max(40.), (vh - top - below).max(40.));
    let aspect = item.aspect.max(0.05);
    let (iw, ih) = if aw / ah > aspect {
        (ah * aspect, ah)
    } else {
        (aw, aw / aspect)
    };
    let (ix, iy) = ((vw - iw) / 2., top + (ah - ih) / 2.);
    let image_rect = gpui::Bounds::new(
        point(gpui::px(ix), gpui::px(iy)),
        gpui::size(gpui::px(iw), gpui::px(ih)),
    );

    let focus = focus_handle(cx);
    let thumb = item.thumb.clone();
    let accent = theme.accent;
    let ink = theme.ink;
    let many = count > 1;

    let button = |id: &'static str, glyph: &'static str| {
        div()
            .id(id)
            .cursor_pointer()
            .size(px(44.))
            .flex()
            .items_center()
            .justify_center()
            .rounded_full()
            .bg(theme.veil(0.9))
            .border_1()
            .border_color(theme.rule)
            .font_family(theme::SANS)
            .text_size(px(28.))
            .line_height(px(28.))
            .text_color(ink)
            .hover(move |s| s.text_color(accent).border_color(accent))
            .child(glyph)
    };

    let veil = div()
        .id("lightbox")
        .track_focus(&focus)
        .occlude()
        .relative()
        .w(gpui::px(vw))
        .h(gpui::px(vh))
        .bg(theme.paper)
        .font_family(theme::BODY)
        .text_color(ink)
        // a modal: every key is the lightbox's while it's open ("/" doesn't open Find behind it)
        .on_key_down(|e: &KeyDownEvent, window, cx| {
            match e.keystroke.key.as_str() {
                "left" => step(-1, window),
                "right" => step(1, window),
                "escape" => close(window),
                _ => {}
            }
            cx.stop_propagation();
        })
        .on_scroll_wheel(|e: &ScrollWheelEvent, window, cx| {
            cx.stop_propagation();
            let d = e.delta.pixel_delta(px(20.));
            let (dx, dy): (f32, f32) = (d.x.into(), d.y.into());
            let mut go = 0isize;
            scope::with(
                |p| &p.lightbox,
                |o| {
                    let mut o = o.borrow_mut();
                    let Some(open) = o.as_mut() else { return };
                    let now = web_time::Instant::now();
                    // a new gesture: touch start, or a pause in the wheel
                    let fresh = matches!(e.touch_phase, TouchPhase::Started)
                        || open
                            .last_wheel
                            .is_none_or(|t| now.duration_since(t).as_millis() > 280);
                    if fresh {
                        open.swipe = 0.;
                        open.swiped = false;
                    }
                    open.last_wheel = Some(now);
                    if dx.abs() > dy.abs() {
                        open.swipe += dx;
                    }
                    if !open.swiped && open.swipe.abs() >= SWIPE {
                        open.swiped = true;
                        // content follows the finger: dragging it left (negative) brings the next one
                        go = if open.swipe < 0. { 1 } else { -1 };
                    }
                    if matches!(e.touch_phase, TouchPhase::Ended) {
                        open.swipe = 0.;
                        open.swiped = false;
                    }
                },
            );
            if go != 0 && many_open() {
                step(go, window);
            }
        })
        .on_mouse_down(MouseButton::Left, |e: &MouseDownEvent, _, _| {
            scope::with(
                |p| &p.lightbox,
                |o| {
                    if let Some(open) = o.borrow_mut().as_mut() {
                        open.press = Some(e.position);
                    }
                },
            );
        })
        .on_mouse_up(MouseButton::Left, move |e: &MouseUpEvent, window, cx| {
            let press = scope::with(
                |p| &p.lightbox,
                |o| o.borrow_mut().as_mut().and_then(|open| open.press.take()),
            );
            let Some(from) = press else { return };
            let dx: f32 = (e.position.x - from.x).into();
            let dy: f32 = (e.position.y - from.y).into();
            if dx.abs() >= SWIPE && dx.abs() > dy.abs() {
                if many_open() {
                    step(if dx < 0. { 1 } else { -1 }, window);
                }
                cx.stop_propagation();
            } else if dx.abs() < 6. && dy.abs() < 6. && !image_rect.contains(&e.position) {
                // a click on the veil itself closes, as the dialog's backdrop did
                close(window);
                cx.stop_propagation();
            }
        })
        // the image, with the page's own copy under it while the large one loads
        .child(
            div()
                .absolute()
                .left(gpui::px(ix))
                .top(gpui::px(iy))
                .w(gpui::px(iw))
                .h(gpui::px(ih))
                .child(
                    super::media::picture(item.large.clone(), |i| {
                        i.size_full().object_fit(ObjectFit::Contain)
                    })
                    // an id gives the image the state it needs to show its stand-in while loading
                    .id(gpui::SharedString::from(format!("lightbox:img:{index}")))
                    .with_loading(move || {
                        img(thumb.clone())
                            .size_full()
                            .object_fit(ObjectFit::Contain)
                            .into_any_element()
                    }),
                ),
        )
        // neighbours load in the background so stepping is instant
        .children(neighbours.into_iter().map(|u| {
            div()
                .absolute()
                .left(gpui::px(-4.))
                .top(gpui::px(-4.))
                .size(gpui::px(1.))
                .opacity(0.)
                .child(img(u).size_full())
        }))
        .child(
            button("lightbox:close", "×")
                .absolute()
                .top(px(10.))
                .right(px(12.))
                .on_click(|_, window, cx| {
                    cx.stop_propagation();
                    close(window);
                }),
        )
        .when(many, |d| {
            let mid = gpui::px(vh / 2.) - px(22.);
            d.child(
                button("lightbox:prev", "‹")
                    .absolute()
                    .left(px(12.))
                    .top(mid)
                    .on_click(|_, window, cx| {
                        cx.stop_propagation();
                        step(-1, window);
                    }),
            )
            .child(
                button("lightbox:next", "›")
                    .absolute()
                    .right(px(12.))
                    .top(mid)
                    .on_click(|_, window, cx| {
                        cx.stop_propagation();
                        step(1, window);
                    }),
            )
        })
        .child(
            div()
                .absolute()
                .left_0()
                .right_0()
                .bottom(px(14.))
                .px(px(24.))
                .flex()
                .flex_col()
                .items_center()
                .gap(px(4.))
                .when(!item.alt.trim().is_empty(), |d| {
                    d.child(
                        div()
                            .max_w(px(crate::design::COLUMN_MAX_W))
                            .text_center()
                            .italic()
                            .text_size(px(16.))
                            .line_height(px(23.))
                            .text_color(theme.muted)
                            .child(item.alt.trim().to_string()),
                    )
                })
                .when(many, |d| {
                    d.child(
                        label(format!("{} / {}", index + 1, count), theme.muted).text_size(px(12.)),
                    )
                }),
        );

    Some(
        deferred(
            anchored()
                .position_mode(AnchoredPositionMode::Window)
                .position(point(gpui::px(0.), gpui::px(0.)))
                .child(veil),
        )
        .priority(10usize)
        .into_any_element(),
    )
}

fn many_open() -> bool {
    scope::with(
        |p| &p.lightbox,
        |o| o.borrow().as_ref().is_some_and(|open| open.items.len() > 1),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn widths_by_dpr() {
        assert_eq!(large_width(1., false), 1920);
        assert_eq!(large_width(2., false), 2560);
        assert_eq!(large_width(3., true), 1280);
    }
}
