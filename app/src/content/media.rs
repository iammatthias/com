use gpui::prelude::*;

use gpui::px;
use gpui::{
    AnyElement, Div, ElementId, Img, ObjectFit, Rgba, Stateful, StyledImage, div, img, rgb,
};

use crate::api::{self, Media};
use crate::dom_video;
use crate::theme::{self, Theme};

use super::lightbox;
use super::md::MediaSrc;
use super::render::{Ctx, alpha, label};

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

pub const PRESETS: [u32; 4] = [480, 720, 960, 1280];

pub fn preset(css_width: f32, scale: f32) -> u32 {
    let want = (css_width * scale.clamp(1., 2.)).ceil() as u32;
    PRESETS
        .iter()
        .copied()
        .find(|p| *p >= want)
        .unwrap_or(PRESETS[PRESETS.len() - 1])
}

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

pub fn still_url(src: &MediaSrc, media: Option<&Media>, css_width: f32, scale: f32) -> String {
    match src {
        MediaSrc::Blob(cid) => api::img_url(cid, preset(css_width, scale), media),
        MediaSrc::Url { url, .. } => url.clone(),
    }
}

pub fn large_url(src: &MediaSrc, media: Option<&Media>, scale: f32, phone: bool) -> String {
    match src {
        MediaSrc::Blob(cid) => api::img_url(cid, lightbox::large_width(scale, phone), media),
        MediaSrc::Url { url, .. } => url.clone(),
    }
}

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

pub fn clip_probe(
    key: String,
    src: String,
    poster: Option<String>,
    mode: dom_video::Mode,
) -> impl IntoElement {
    super::on_paint(move |bounds, window, _| {
        let clip = window.content_mask().bounds;
        dom_video::place(
            &key,
            &src,
            poster.as_deref(),
            mode,
            crate::overlay::Rect::from_bounds(bounds),
            crate::overlay::Rect::from_bounds(clip),
        );
    })
}

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

enum Kind {
    Still,
    Video,
    Audio,
}

fn kind(m: Option<&Media>) -> Kind {
    match m {
        Some(m) if m.is_audio() => Kind::Audio,
        Some(m) if m.is_video() => Kind::Video,
        _ => Kind::Still,
    }
}

const AUDIO_ASPECT: f32 = 4.;

const NARROW_COLUMN_W: f32 = 600.;

pub fn figure(src: &MediaSrc, alt: &str, width: f32, caption: bool, ctx: &Ctx) -> AnyElement {
    let m = meta(src, ctx);
    let plate = match kind(m) {
        Kind::Still => still(src, alt, width, m, ctx),
        Kind::Video => video(src, width, m, ctx),
        Kind::Audio => audio(src, width, m, ctx),
    };
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .child(plate)
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

fn frame(id: ElementId, width: f32, height: f32, m: Option<&Media>, ctx: &Ctx) -> Stateful<Div> {
    div()
        .id(id)
        .cursor_pointer()
        .w(px(width))
        .h(px(height))
        .bg(plate_color(m, ctx))
        .relative()
        .overflow_hidden()
}

fn poster(m: Option<&Media>, width: f32, ctx: &Ctx) -> Option<String> {
    m.and_then(|m| m.thumb_cid.as_deref()).map(|cid| {
        chosen_url(ctx, cid, || {
            api::img_url(cid, preset(width, ctx.scale), ctx.media.get(cid))
        })
    })
}

fn play_badge(what: &'static str, theme: &Theme) -> Div {
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
        .child(label(what, theme.muted))
        .child(
            div()
                .font_family(theme::BODY)
                .italic()
                .text_size(px(17.))
                .text_color(theme.accent)
                .child("play →"),
        )
}

fn still(src: &MediaSrc, alt: &str, width: f32, m: Option<&Media>, ctx: &Ctx) -> Stateful<Div> {
    let aspect = m.map(Media::aspect).unwrap_or(4. / 3.);
    let url = chosen_url(ctx, &original_url(src), || {
        still_url(src, m, width, ctx.scale)
    });
    let probe_key = format!("{}:{}", ctx.key, original_url(src));
    let shown = Some(url.clone()).filter(|_| super::near::near(&probe_key));
    let index = {
        let mut g = ctx.gallery.borrow_mut();
        g.push(lightbox::Item {
            large: large_url(src, m, ctx.scale, ctx.width < NARROW_COLUMN_W),
            thumb: url,
            alt: alt.trim().to_string(),
            aspect,
        });
        g.len() - 1
    };
    let gallery = ctx.gallery.clone();
    frame(ctx.id("zoom"), width, (width / aspect).round(), m, ctx)
        .child(super::near::probe(probe_key))
        .when_some(shown, |d, url| {
            d.child(picture(url, |i| i.size_full().object_fit(ObjectFit::Cover)))
        })
        .on_click(move |_, window, cx| lightbox::open(&gallery, index, window, cx))
}

fn audio(src: &MediaSrc, width: f32, m: Option<&Media>, ctx: &Ctx) -> Stateful<Div> {
    let url = original_url(src);
    let accent = ctx.theme.accent;
    frame(
        ctx.id("play"),
        width,
        (width / AUDIO_ASPECT).round(),
        m,
        ctx,
    )
    .when_some(poster(m, width, ctx), |d, p| {
        d.child(picture(p, |i| i.size_full().object_fit(ObjectFit::Cover)))
    })
    .child(play_badge("SOUND", ctx.theme))
    .hover_style(move |s| s.border_1().border_color(accent))
    .on_click(move |_, _, _| crate::route::open_external(&url))
}

fn video(src: &MediaSrc, width: f32, m: Option<&Media>, ctx: &Ctx) -> Stateful<Div> {
    let aspect = dom_video::aspect(&original_url(src))
        .or_else(|| m.and_then(Media::known_aspect))
        .unwrap_or(16. / 9.);
    let poster = poster(m, width, ctx);
    let key = format!("{}:{}", ctx.key, original_url(src));
    let playing = dom_video::playing(&key);
    let toggle_key = key.clone();
    frame(ctx.id("clip"), width, (width / aspect).round(), m, ctx)
        .when_some(poster.clone(), |d, p| {
            d.child(picture(p, |i| i.size_full().object_fit(ObjectFit::Contain)))
        })
        .child(clip_probe(
            key,
            original_url(src),
            poster,
            dom_video::Mode::Auto,
        ))
        .when(!playing, |d| {
            d.child(play_badge("MOVING PICTURE", ctx.theme))
        })
        .on_click(move |_, window, _| {
            dom_video::toggle(&toggle_key);
            window.refresh();
        })
}

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
        .map(|m| {
            if m.is_audio() {
                AUDIO_ASPECT
            } else {
                m.aspect()
            }
        })
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
