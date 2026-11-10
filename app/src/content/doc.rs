use gpui::prelude::*;

use gpui::px;
use gpui::{AnyElement, App, SharedString, Window, div};

use crate::api::{Doc, Navigate, RelatedRef};
use crate::design;
use crate::select::{Join, Selection};
use crate::theme::{self, Theme};

use super::format::{clip, encode_segment, fmt_date, fmt_date_short};
use super::pages::{Prose, body_blocks, display_title};
use super::render::{self, alpha, double_rule, hairline, label};
use super::{column, link};

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
        .child(display_title(&doc.title, theme, sel));
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
    let mut body = render::blocks(body, &ctx, window, cx);
    super::toc::mark(&mut body, &contents);
    col = col
        .child(render::stacked(body))
        .child(div().pt(px(24.)).child(double_rule(theme, 64.)))
        .child(terrazzo_banner(&doc.rkey, &doc.cid, width, window, cx))
        .child(colophon(doc, &key, nav, theme, sel));
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
pub(super) fn terrazzo_banner(
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

pub(super) fn colophon(
    doc: &Doc,
    key: &str,
    nav: &Navigate,
    theme: &Theme,
    sel: &Selection,
) -> AnyElement {
    let row = |k: &str, v: AnyElement| {
        div()
            .flex()
            .items_center()
            .gap(px(14.))
            .child(div().w(px(110.)).flex_none().child(label(
                sel.text(k.to_uppercase()).join(Join::Line),
                theme.muted,
            )))
            .child(div().flex_1().min_w_0().child(v))
            .into_any_element()
    };
    let text = |s: String| {
        div()
            .italic()
            .child(sel.text(s).join(Join::Tab))
            .into_any_element()
    };
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
                .child(sel.text(doc.cid.clone()).join(Join::Tab))
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
                .hover_style(move |s| s.text_color(accent))
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
                .hover_style(move |s| s.text_color(accent).border_color(accent))
                .child(div().text_color(theme.muted).child("#"))
                .child(t.clone())
                .on_click(move |_, window, cx| nav(href.clone(), window, cx)),
        );
    }
    row.into_any_element()
}
