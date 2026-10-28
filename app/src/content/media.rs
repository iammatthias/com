//! Figures, video/audio stand-ins, and the image width presets.

use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, Img, ObjectFit, Rgba, StyledImage, div, img, rgb};

use crate::api::{self, Media};
use crate::dom_video;
use crate::theme;

use super::lightbox;
use super::md::MediaSrc;
use super::render::{Ctx, alpha, label};

/// `make()`'s URL for `source` on this page, chosen the first time it's drawn.
fn chosen_url(ctx: &Ctx, source: &str, make: impl FnOnce() -> String) -> String {
    super::scope::with(
        |p| &p.chosen,
        |chosen| {
            let mut chosen = chosen.borrow_mut();
            let key = (ctx.key.to_string(), source.to_string());
            if let Some(url) = chosen.get(&key) {
                return url.clone();
            }
            let url = make();
            chosen.insert(key, url.clone());
            url
        },
    )
}

/// Widths the Worker's image proxy is asked for; one per device-pixel bucket.
pub const PRESETS: [u32; 4] = [480, 720, 960, 1280];

/// The smallest preset at least as wide as the slot in device pixels. Density stops at 2×:
/// a 3× phone can't tell, and every decoded image is held in memory while its page is up.
pub fn preset(css_width: f32, scale: f32) -> u32 {
    let want = (css_width * scale.clamp(1., 2.)).ceil() as u32;
    PRESETS
        .iter()
        .copied()
        .find(|p| *p >= want)
        .unwrap_or(PRESETS[PRESETS.len() - 1])
}

/// `#rrggbb` / `#rgb` / `rgb(r, g, b)` → a colour for the placeholder plate.
pub fn parse_color(s: &str) -> Option<Rgba> {
    let s = s.trim();
    if let Some(hex) = s.strip_prefix('#') {
        let hex = match hex.len() {
            3 => hex.chars().flat_map(|c| [c, c]).collect::<String>(),
            6 => hex.to_string(),
            8 => hex.get(..6)?.to_string(),
            _ => return None,
        };
        return u32::from_str_radix(&hex, 16).ok().map(rgb);
    }
    if let Some(inner) = s
        .strip_prefix("rgb(")
        .or_else(|| s.strip_prefix("rgba("))
        .and_then(|r| r.strip_suffix(')'))
    {
        let parts: Vec<u32> = inner
            .split(',')
            .take(3)
            .filter_map(|p| p.trim().parse::<f32>().ok())
            .map(|v| v as u32)
            .collect();
        if parts.len() == 3 {
            return Some(rgb((parts[0] << 16) | (parts[1] << 8) | parts[2]));
        }
    }
    None
}

pub fn meta<'a>(src: &MediaSrc, ctx: &'a Ctx) -> Option<&'a Media> {
    src.cid().and_then(|c| ctx.media.get(c))
}

/// The URL to fetch for a still at `css_width`.
pub fn still_url(src: &MediaSrc, media: Option<&Media>, css_width: f32, scale: f32) -> String {
    match src {
        MediaSrc::Blob(cid) => api::img_url(cid, preset(css_width, scale), media),
        MediaSrc::Url { url, .. } => url.clone(),
    }
}

/// The lightbox's copy: 1280 wide on a phone, else 1920 or 2560 by device pixel ratio.
pub fn large_url(src: &MediaSrc, media: Option<&Media>, scale: f32, phone: bool) -> String {
    match src {
        MediaSrc::Blob(cid) => api::img_url(cid, lightbox::large_width(scale, phone), media),
        MediaSrc::Url { url, .. } => url.clone(),
    }
}

/// The image at `url`, drawn by `style`. When a wsrv.nl resize doesn't load (Safari's fetches to
/// it fail outright at times), the same image through the Worker takes its place.
pub fn picture(url: String, style: impl Fn(Img) -> Img + Clone + 'static) -> Img {
    let local = api::local(&url);
    let fallback_style = style.clone();
    style(img(url)).with_fallback(move || match &local {
        Some(local) => fallback_style(img(local.clone()))
            .with_fallback(|| div().into_any_element())
            .into_any_element(),
        None => div().into_any_element(),
    })
}

/// An invisible probe filling its parent that tells `dom_video` where the clip `key` is
/// painted this render, clipped to what of the page is visible.
pub fn clip_probe(
    key: String,
    src: String,
    poster: Option<String>,
    mode: dom_video::Mode,
) -> impl IntoElement {
    div().absolute().inset_0().child(
        gpui::canvas(
            move |bounds, window, _| {
                let clip = window.content_mask().bounds;
                dom_video::place(
                    &key,
                    &src,
                    poster.as_deref(),
                    mode,
                    crate::overlay::Rect::from_bounds(bounds),
                    crate::overlay::Rect::from_bounds(clip),
                );
            },
            |_, _, _, _| {},
        )
        .size_full(),
    )
}

/// Where the original bytes live (video/audio open this in a new tab).
pub fn original_url(src: &MediaSrc) -> String {
    match src {
        MediaSrc::Blob(cid) => api::blob_url(cid),
        MediaSrc::Url { url, .. } => url.clone(),
    }
}

fn plate_color(m: Option<&Media>, ctx: &Ctx) -> Rgba {
    m.and_then(|m| m.dominant_color.as_deref())
        .and_then(parse_color)
        .unwrap_or_else(|| alpha(ctx.theme.rule, 0.55))
}

/// An image (or a video/audio stand-in) at `width`, height from the blob's aspect.
pub fn figure(src: &MediaSrc, alt: &str, width: f32, caption: bool, ctx: &Ctx) -> AnyElement {
    let m = meta(src, ctx);
    if m.is_some_and(|m| m.is_video() || m.is_audio()) {
        return moving(src, alt, width, ctx);
    }
    let aspect = m.map(Media::aspect).unwrap_or(4. / 3.);
    let height = (width / aspect).round();
    let bg = plate_color(m, ctx);
    let url = chosen_url(ctx, &original_url(src), || {
        still_url(src, m, width, ctx.scale)
    });
    let probe_key = format!("{}:{}", ctx.key, original_url(src));
    let shown = Some(url.clone()).filter(|_| super::near::near(&probe_key));
    // every image opens in the lightbox, stepping through the payload's others
    let index = {
        let mut g = ctx.gallery.borrow_mut();
        g.push(lightbox::Item {
            large: large_url(src, m, ctx.scale, ctx.width < 600.),
            thumb: url,
            alt: alt.trim().to_string(),
            aspect,
        });
        g.len() - 1
    };
    let gallery = ctx.gallery.clone();
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(
            div()
                .id(ctx.id("zoom"))
                .cursor_pointer()
                .w(px(width))
                .h(px(height))
                .bg(bg)
                .overflow_hidden()
                .relative()
                .child(super::near::probe(probe_key))
                .when_some(shown, |d, url| {
                    d.child(picture(url, |i| i.size_full().object_fit(ObjectFit::Cover)))
                })
                .on_click(move |_, window, cx| lightbox::open(&gallery, index, window, cx)),
        )
        .when(caption && !alt.trim().is_empty(), |d| {
            d.child(
                div()
                    .w(px(width))
                    .text_center()
                    .italic()
                    .text_size(px(15.))
                    .line_height(px(22.))
                    .text_color(ctx.theme.muted)
                    .child(ctx.sel.text(alt.trim().to_string())),
            )
        })
        .into_any_element()
}

/// Moving media. Video plays as a DOM `<video>` laid over the canvas (`video`, and
/// `dom_video`); audio can't play on the canvas yet: its poster (or the dominant colour) with a
/// lettered "play" that opens the original in a new tab.
pub fn moving(src: &MediaSrc, alt: &str, width: f32, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    let m = meta(src, ctx);
    let audio = m.is_some_and(Media::is_audio);
    if !audio {
        return video(src, alt, width, ctx);
    }
    let aspect = if audio {
        4.
    } else {
        m.map(Media::aspect).unwrap_or(16. / 9.)
    };
    let height = (width / aspect).round();
    let poster = m.and_then(|m| m.thumb_cid.as_deref()).map(|cid| {
        chosen_url(ctx, cid, || {
            api::img_url(cid, preset(width, ctx.scale), ctx.media.get(cid))
        })
    });
    let url = original_url(src);
    let accent = theme.accent;
    let what = if audio { "Sound" } else { "Moving picture" };
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(
            div()
                .id(ctx.id("play"))
                .cursor_pointer()
                .w(px(width))
                .h(px(height))
                .bg(plate_color(m, ctx))
                .relative()
                .overflow_hidden()
                .when_some(poster, |d, p| {
                    d.child(picture(p, |i| i.size_full().object_fit(ObjectFit::Cover)))
                })
                .child(
                    div()
                        .absolute()
                        .bottom(px(12.))
                        .left(px(12.))
                        .px(px(10.))
                        .py(px(2.))
                        .bg(theme.veil(0.88))
                        .flex()
                        .items_baseline()
                        .gap(px(8.))
                        .child(label(what.to_uppercase(), theme.muted))
                        .child(
                            div()
                                .font_family(theme::BODY)
                                .italic()
                                .text_size(px(17.))
                                .text_color(theme.accent)
                                .child("play →"),
                        ),
                )
                .hover_style(move |s| s.border_1().border_color(accent))
                .on_click(move |_, _, _| crate::route::open_external(&url)),
        )
        .when(!alt.trim().is_empty(), |d| {
            d.child(
                div()
                    .w(px(width))
                    .text_center()
                    .italic()
                    .text_size(px(15.))
                    .line_height(px(22.))
                    .text_color(theme.muted)
                    .child(ctx.sel.text(alt.trim().to_string())),
            )
        })
        .into_any_element()
}

/// A clip, playing in place: the poster (or the dominant colour) on the canvas, with a real
/// `<video>` laid over it by `dom_video`. Muted and looping, it starts by itself unless the
/// reader prefers reduced motion; then a lettered "play" starts it. A click plays or pauses.
pub fn video(src: &MediaSrc, alt: &str, width: f32, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    let m = meta(src, ctx);
    // the clip's own shape once its <video> has read it; until then blobs' size, or a guess
    let aspect = dom_video::aspect(&original_url(src))
        .or_else(|| m.and_then(Media::known_aspect))
        .unwrap_or(16. / 9.);
    let height = (width / aspect).round();
    let poster = m.and_then(|m| m.thumb_cid.as_deref()).map(|cid| {
        chosen_url(ctx, cid, || {
            api::img_url(cid, preset(width, ctx.scale), ctx.media.get(cid))
        })
    });
    let key = format!("{}:{}", ctx.key, original_url(src));
    let playing = dom_video::playing(&key);
    let toggle_key = key.clone();
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(
            div()
                .id(ctx.id("clip"))
                .cursor_pointer()
                .w(px(width))
                .h(px(height))
                .bg(plate_color(m, ctx))
                .relative()
                .overflow_hidden()
                .when_some(poster.clone(), |d, p| {
                    d.child(picture(p, |i| i.size_full().object_fit(ObjectFit::Contain)))
                })
                .child(clip_probe(
                    key,
                    original_url(src),
                    poster,
                    dom_video::Mode::Auto,
                ))
                // only seen while the clip isn't drawn over it: before it starts, or with motion reduced
                .when(!playing, |d| {
                    d.child(
                        div()
                            .absolute()
                            .bottom(px(12.))
                            .left(px(12.))
                            .px(px(10.))
                            .py(px(2.))
                            .bg(theme.veil(0.88))
                            .flex()
                            .items_baseline()
                            .gap(px(8.))
                            .child(label("MOVING PICTURE", theme.muted))
                            .child(
                                div()
                                    .font_family(theme::BODY)
                                    .italic()
                                    .text_size(px(17.))
                                    .text_color(theme.accent)
                                    .child("play →"),
                            ),
                    )
                })
                .on_click(move |_, window, _| {
                    dom_video::toggle(&toggle_key);
                    window.refresh();
                }),
        )
        .when(!alt.trim().is_empty(), |d| {
            d.child(
                div()
                    .w(px(width))
                    .text_center()
                    .italic()
                    .text_size(px(15.))
                    .line_height(px(22.))
                    .text_color(theme.muted)
                    .child(ctx.sel.text(alt.trim().to_string())),
            )
        })
        .into_any_element()
}

/// Two balanced columns of tiles (a masonry the way the old CSS columns read).
pub fn two_columns(items: Vec<(f32, AnyElement)>, width: f32, gap: f32) -> AnyElement {
    let col_w = (width - gap) / 2.;
    let mut left: Vec<AnyElement> = Vec::new();
    let mut right: Vec<AnyElement> = Vec::new();
    let (mut hl, mut hr) = (0f32, 0f32);
    for (aspect, el) in items {
        let h = col_w / aspect.max(0.1);
        if hl <= hr {
            hl += h + gap;
            left.push(el);
        } else {
            hr += h + gap;
            right.push(el);
        }
    }
    div()
        .flex()
        .gap(px(gap))
        .child(
            div()
                .w(px(col_w))
                .flex()
                .flex_col()
                .gap(px(gap))
                .children(left),
        )
        .child(
            div()
                .w(px(col_w))
                .flex()
                .flex_col()
                .gap(px(gap))
                .children(right),
        )
        .into_any_element()
}

pub fn aspect_of(src: &MediaSrc, ctx: &Ctx) -> f32 {
    meta(src, ctx)
        .map(|m| if m.is_audio() { 4. } else { m.aspect() })
        .unwrap_or(4. / 3.)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn presets_by_dpr() {
        assert_eq!(preset(680., 1.), 720);
        assert_eq!(preset(680., 2.), 1280);
        assert_eq!(preset(330., 1.), 480);
        assert_eq!(preset(330., 2.), 720);
        assert_eq!(preset(330., 3.), 720);
    }

    #[test]
    fn colors() {
        assert!(parse_color("#a0b0c0").is_some());
        assert!(parse_color("#abc").is_some());
        assert!(parse_color("rgb(10, 20, 30)").is_some());
        assert!(parse_color("teal").is_none());
    }
}
