//! Block tree → GPUI elements. Book typography: Newsreader body with generous leading and
//! display heads, Inter for small tracked labels, the accent blue for links and marks,
//! hairline rules instead of boxes.

use std::cell::Cell;
use std::collections::HashMap;
use std::ops::Range;
use std::rc::Rc;

use gpui::prelude::*;

use gpui::px;
use gpui::{
    AnyElement, App, ElementId, FontStyle, HighlightStyle, Hsla, InteractiveText, Rgba,
    SharedString, StrikethroughStyle, StyledText, UnderlineStyle, Window, div,
};

use crate::api::{Media, Navigate};
use crate::design;
use crate::theme::{self, Theme};

use super::cache::Parsed;
use super::md::{Align, Block, CalloutKind, Footnote, ListItem, Rich};
use super::{media, recipe_view, series_view, state};

/// Everything a block needs while rendering one payload.
pub struct Ctx<'a> {
    pub theme: &'a Theme,
    pub nav: &'a Navigate,
    pub media: &'a HashMap<String, Media>,
    /// the tree being drawn, for the series it embeds
    pub parsed: Rc<Parsed>,
    /// reading column width in px
    pub width: f32,
    pub scale: f32,
    /// unique per payload (doc cid, post rkey…): prefixes element ids and view state keys
    pub key: SharedString,
    /// every image figure rendered so far, for the lightbox to step through
    pub gallery: super::lightbox::Gallery,
    n: Cell<usize>,
    depth: Cell<u8>,
}

impl<'a> Ctx<'a> {
    pub fn new(
        theme: &'a Theme,
        nav: &'a Navigate,
        media: &'a HashMap<String, Media>,
        parsed: Rc<Parsed>,
        width: f32,
        scale: f32,
        key: impl Into<SharedString>,
    ) -> Self {
        Self {
            theme,
            nav,
            media,
            parsed,
            width,
            scale,
            key: key.into(),
            gallery: Default::default(),
            n: Cell::new(0),
            depth: Cell::new(0),
        }
    }

    /// A fresh element id, stable across frames as long as the tree renders in the same order.
    pub fn id(&self, tag: &str) -> ElementId {
        let n = self.n.get();
        self.n.set(n + 1);
        ElementId::Name(format!("{}:{tag}{n}", self.key).into())
    }

    /// The same context narrowed to a sub-column (series panels, table cells).
    pub fn with_width<R>(&self, width: f32, f: impl FnOnce(&Ctx) -> R) -> R {
        let inner = Ctx {
            theme: self.theme,
            nav: self.nav,
            media: self.media,
            parsed: self.parsed.clone(),
            width,
            scale: self.scale,
            key: self.key.clone(),
            gallery: self.gallery.clone(),
            n: Cell::new(self.n.get()),
            depth: Cell::new(self.depth.get()),
        };
        let out = f(&inner);
        self.n.set(inner.n.get());
        out
    }
}

pub fn hsla(c: Rgba) -> Hsla {
    gpui::rgb_to_hsla(c)
}

pub fn alpha(c: Rgba, a: f32) -> Rgba {
    Rgba { alpha: a, ..c }
}

/// The site's one small label: Inter, medium, tracked capitals (pass the text already in caps
/// or let the caller decide), for eyebrows, metadata and the panels' field names.
pub fn label(text: impl Into<SharedString>, color: Rgba) -> gpui::Div {
    div()
        .font_family(theme::SANS)
        .font_weight(gpui::FontWeight::MEDIUM)
        .text_size(px(design::LABEL_SIZE))
        .line_height(px(design::LABEL_LEADING))
        .letter_spacing(px(design::LABEL_TRACKING))
        .text_color(color)
        .child(text.into())
}

/// A pair of hairlines, the plate's own rule.
pub fn double_rule(theme: &Theme, width: f32) -> gpui::Div {
    div()
        .w(px(width))
        .mx_auto()
        .flex()
        .flex_col()
        .gap(px(2.))
        .child(div().h(px(1.)).bg(theme.rule))
        .child(div().h(px(1.)).bg(theme.rule))
}

pub fn hairline(theme: &Theme) -> gpui::Div {
    div().w_full().h(px(1.)).bg(theme.rule)
}

// ---------------------------------------------------------------------------------------------
// inline text

struct Runs {
    highlights: Vec<(Range<usize>, HighlightStyle)>,
    fonts: Vec<(Range<usize>, SharedString)>,
    link_ranges: Vec<Range<usize>>,
    link_ids: Vec<u16>,
}

fn styled_runs(r: &Rich, theme: &Theme, hovered: Option<u16>) -> Runs {
    let mut s = Runs {
        highlights: Vec::new(),
        fonts: Vec::new(),
        link_ranges: Vec::new(),
        link_ids: Vec::new(),
    };
    for (range, m) in &r.spans {
        if m.plain() || range.is_empty() {
            continue;
        }
        let mut h = HighlightStyle::default();
        if m.em {
            h.font_style = Some(FontStyle::Italic);
        }
        if m.code {
            s.fonts.push((range.clone(), theme::MONO.into()));
            h.color = Some(hsla(alpha(theme.ink, 0.82)));
        } else if m.strong {
            h.font_weight = Some(gpui::FontWeight::SEMIBOLD);
        }
        if m.strike {
            h.strikethrough = Some(StrikethroughStyle {
                thickness: px(1.),
                color: Some(hsla(theme.muted)),
            });
            h.color = Some(hsla(theme.muted));
        }
        if m.note {
            h.color = Some(hsla(theme.accent));
        }
        if let Some(l) = m.link {
            let hot = hovered == Some(l);
            h.color = Some(hsla(if hot { theme.accent } else { theme.ink }));
            h.underline = Some(UnderlineStyle {
                thickness: px(1.),
                color: Some(hsla(alpha(theme.accent, if hot { 0.9 } else { 0.45 }))),
                wavy: false,
            });
            s.link_ranges.push(range.clone());
            s.link_ids.push(l);
        }
        s.highlights.push((range.clone(), h));
    }
    s
}

/// A run of rich text: emphasis, small-caps strong, mono code, links that navigate.
pub fn rich(r: &Rich, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    if r.text.is_empty() {
        return div().into_any_element();
    }
    let id = ctx.id("t");
    if r.links.is_empty() {
        let s = styled_runs(r, ctx.theme, None);
        return StyledText::new(r.text.clone())
            .with_highlights(s.highlights)
            .with_font_family_overrides(s.fonts)
            .into_any_element();
    }
    let _ = (window, cx);
    let s = styled_runs(r, ctx.theme, state::get::<Option<u16>>(&id));
    let hover_id = id.clone();
    let targets: Vec<String> = s
        .link_ids
        .iter()
        .map(|l| r.links[*l as usize].clone())
        .collect();
    let nav = ctx.nav.clone();
    let ranges = s.link_ranges.clone();
    let ids = s.link_ids.clone();
    InteractiveText::new(
        id,
        StyledText::new(r.text.clone())
            .with_highlights(s.highlights)
            .with_font_family_overrides(s.fonts),
    )
    .on_click(s.link_ranges, move |ix, window, cx| {
        let href = targets[ix].clone();
        if !href.starts_with('#') {
            nav(href, window, cx);
        }
    })
    .on_hover(move |ix, _event, window, _cx| {
        let over = ix.and_then(|i| ranges.iter().position(|r| r.contains(&i)).map(|p| ids[p]));
        state::update::<Option<u16>>(&hover_id, window, |h| *h = over);
    })
    .into_any_element()
}

// ---------------------------------------------------------------------------------------------
// blocks

pub fn blocks(list: &[Block], ctx: &Ctx, window: &mut Window, cx: &mut App) -> Vec<AnyElement> {
    list.iter().map(|b| block(b, ctx, window, cx)).collect()
}

/// A vertical stack of blocks with the body's paragraph spacing.
pub fn stack(list: &[Block], ctx: &Ctx, window: &mut Window, cx: &mut App) -> gpui::Div {
    div()
        .flex()
        .flex_col()
        .gap(px(18.))
        .children(blocks(list, ctx, window, cx))
}

pub fn block(b: &Block, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    match b {
        Block::Heading { level, text } => heading(*level, text, ctx, window, cx),
        Block::Para(r) => div().child(rich(r, ctx, window, cx)).into_any_element(),
        Block::Quote(body) => div()
            .pl(px(22.))
            .border_l_1()
            .border_color(theme.rule)
            .italic()
            .child(ctx.with_width(ctx.width - 22., |c| stack(body, c, window, cx)))
            .into_any_element(),
        Block::Callout { kind, body } => callout(*kind, body, ctx, window, cx),
        Block::List { start, items } => list(*start, items, ctx, window, cx),
        Block::Code { lang, code } => code_block(
            code,
            (!lang.is_empty()).then_some(lang.as_str()),
            false,
            ctx,
        ),
        Block::Mermaid(src) => div()
            .flex()
            .flex_col()
            .gap(px(4.))
            .child(diagram(src, ctx))
            .child(
                div().flex().justify_end().child(
                    super::link(
                        ctx.id("mermaid"),
                        "View diagram →",
                        &pele_playground(src),
                        ctx.nav,
                        theme,
                    )
                    .italic()
                    .text_size(px(16.))
                    .text_color(theme.accent),
                ),
            )
            .into_any_element(),
        Block::Recipe(r) => recipe_view::view(r, ctx, window, cx),
        Block::Table { aligns, head, rows } => table(aligns, head, rows, ctx, window, cx),
        Block::Rule => div()
            .py(px(10.))
            .child(double_rule(theme, 160.))
            .into_any_element(),
        Block::Figure(f) => media::figure(&f.src, &f.alt, ctx.width, true, ctx),
        Block::Series(slug) => match ctx.parsed.series.get(slug) {
            Some(tree) => series_view::view(tree, ctx, window, cx),
            None => muted_note(&format!("The series “{slug}” is missing."), ctx),
        },
        Block::Reveal { label, body } => reveal(label, body, ctx, window, cx),
        Block::Embed { name, props } => match crate::dom_embed::lookup(name) {
            Some(embed) if cfg!(target_family = "wasm") => embed_block(embed, props, ctx),
            _ => muted_note(&format!("<{name}> plays in the browser."), ctx),
        },
        Block::Nothing => link_out(
            "Nothing",
            "A 1/1 transparent SVG stored onchain, priced at $100,000,000 in USDC or the Chainlink-rate equivalent in ETH.",
            "NOTHING on Etherscan",
            "https://etherscan.io/address/0x9DfBA83F62cBc57e3E3d86C6BEED1B401669Eb8B",
            ctx,
        ),
        Block::UnknownComponent(name) => muted_note(
            &format!("Unknown component <{name}>. It may not be deployed yet."),
            ctx,
        ),
        Block::Footnotes(notes) => footnotes(notes, ctx, window, cx),
    }
}

fn heading(level: u8, text: &Rich, ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    let body = rich(text, ctx, window, cx);
    let el = match level {
        // a scale off the 19px body: 30 · 24 · 20 italic · tracked label
        1 => div()
            .pt(px(20.))
            .font_family(theme::DISPLAY)
            .text_size(px(30.))
            .line_height(px(37.))
            .letter_spacing(px(-0.3)),
        2 => div()
            .pt(px(18.))
            .font_family(theme::DISPLAY)
            .font_weight(gpui::FontWeight::MEDIUM)
            .text_size(px(24.))
            .line_height(px(31.))
            .letter_spacing(px(-0.2)),
        3 => div()
            .pt(px(10.))
            .italic()
            .text_size(px(20.))
            .line_height(px(29.)),
        _ => div()
            .pt(px(10.))
            .font_family(theme::SANS)
            .font_weight(gpui::FontWeight::MEDIUM)
            .text_size(px(12.))
            .line_height(px(20.))
            .letter_spacing(px(0.9))
            .text_color(theme.muted),
    };
    el.when(matches!(level, 2 | 3), |d| {
        d.relative().child(super::toc::probe(&text.text))
    })
    .child(body)
    .into_any_element()
}

fn callout_mark(kind: CalloutKind) -> &'static str {
    match kind {
        CalloutKind::Note => "→",
        CalloutKind::Tip => "¶",
        CalloutKind::Important => "§",
        CalloutKind::Warning => "†",
        CalloutKind::Caution => "‡",
    }
}

fn callout(
    kind: CalloutKind,
    body: &[Block],
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    div()
        .pl(px(20.))
        .border_l_1()
        .border_color(alpha(theme.accent, 0.7))
        .flex()
        .flex_col()
        .gap(px(6.))
        .child(
            div()
                .flex()
                .items_baseline()
                .gap(px(8.))
                .child(
                    div()
                        .text_color(theme.accent)
                        .text_size(px(20.))
                        .child(callout_mark(kind)),
                )
                .child(label(kind.label(), theme.accent)),
        )
        .child(ctx.with_width(ctx.width - 20., |c| stack(body, c, window, cx)))
        .into_any_element()
}

fn list(
    start: Option<u64>,
    items: &[ListItem],
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    let depth = ctx.depth.get();
    ctx.depth.set(depth + 1);
    let gutter = 30.;
    let rows: Vec<AnyElement> = items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let marker: AnyElement = match (item.task, start) {
                (Some(done), _) => div()
                    .mt(px(9.))
                    .size(px(13.))
                    .border_1()
                    .border_color(if done { theme.accent } else { theme.muted })
                    .flex()
                    .items_center()
                    .justify_center()
                    .when(done, |d| {
                        d.child(
                            div()
                                .font_family(theme::MONO)
                                .text_size(px(11.))
                                .line_height(px(11.))
                                .text_color(theme.accent)
                                .child("✓"),
                        )
                    })
                    .into_any_element(),
                (None, Some(n)) => div()
                    .text_color(theme.accent)
                    .child(format!("{}.", n + i as u64))
                    .into_any_element(),
                (None, None) => div()
                    .text_color(theme.accent)
                    .child(match depth % 3 {
                        0 => "•",
                        1 => "–",
                        _ => "·",
                    })
                    .into_any_element(),
            };
            let body = ctx.with_width(ctx.width - gutter, |c| {
                div()
                    .flex()
                    .flex_col()
                    .gap(px(8.))
                    .children(blocks(&item.body, c, window, cx))
            });
            div()
                .flex()
                .child(
                    div()
                        .w(px(gutter))
                        .flex_none()
                        .flex()
                        .justify_end()
                        .pr(px(10.))
                        .child(marker),
                )
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .when(item.task == Some(true), |d| d.text_color(theme.muted))
                        .child(body),
                )
                .into_any_element()
        })
        .collect();
    ctx.depth.set(depth);
    div()
        .flex()
        .flex_col()
        .gap(px(8.))
        .children(rows)
        .into_any_element()
}

pub(super) fn code_block(code: &str, tag: Option<&str>, diagram: bool, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    let id = ctx.id("code");
    div()
        .flex()
        .flex_col()
        .gap(px(4.))
        .child(
            div()
                .flex()
                .justify_between()
                .child(hairline(theme).flex_1().mt(px(10.)))
                .when_some(tag, |d, tag| {
                    d.child(div().pl(px(10.)).child(if diagram {
                        label(tag.to_string(), theme.accent)
                    } else {
                        div()
                            .font_family(theme::MONO)
                            .text_size(px(12.))
                            .line_height(px(20.))
                            .text_color(theme.muted)
                            .child(tag.to_string())
                    }))
                }),
        )
        .child({
            // Lilex at 14px advances about 8.4px a character
            let longest = code.lines().map(|l| l.chars().count()).max().unwrap_or(0) as f32;
            hscroll(
                id,
                ctx.width,
                longest * 8.45 + 4.,
                div()
                    .py(px(6.))
                    .font_family(theme::MONO)
                    .text_size(px(14.))
                    .line_height(px(22.))
                    .text_color(alpha(theme.ink, 0.88))
                    .child(div().whitespace_nowrap().child(code.to_string())),
                theme,
            )
        })
        .child(hairline(theme))
        .into_any_element()
}

/// How far a wide block has been slid sideways, design px.
#[derive(Clone, Copy, Default, PartialEq)]
struct Slide(f32);

/// A block wider than the column (recipe grids, tables, code) slides sideways inside it.
///
/// The page's own scroller turns sideways wheel and pan deltas into vertical scrolling, so a
/// nested GPUI scroll container would move both at once. This keeps its own offset instead:
/// sideways gestures over it slide it (and stop there), vertical ones pass on to the page.
/// A hairline under it shows how much there is and where the view sits.
pub fn hscroll(
    id: ElementId,
    view_w: f32,
    content_w: f32,
    child: impl IntoElement,
    theme: &Theme,
) -> AnyElement {
    let max = (content_w - view_w).max(0.);
    if max < 1. {
        return div()
            .w(px(view_w))
            .overflow_hidden()
            .child(child)
            .into_any_element();
    }
    let at = state::get::<Slide>(&id).0.clamp(0., max);
    let key = id.clone();
    let thumb_w = view_w * view_w / content_w;
    let thumb_x = (view_w - thumb_w) * at / max;
    div()
        .id(id)
        .w(px(view_w))
        .flex()
        .flex_col()
        .gap(px(3.))
        .on_scroll_wheel(move |e, window, cx| {
            let d = e.delta.pixel_delta(gpui::px(20.));
            let (dx, dy): (f32, f32) = (d.x.into(), d.y.into());
            if dx.abs() <= dy.abs() {
                return;
            }
            cx.stop_propagation();
            state::update::<Slide>(&key, window, |o| o.0 = (o.0 - dx).clamp(0., max));
        })
        .child(
            div()
                .w(px(view_w))
                .overflow_hidden()
                .child(div().ml(px(-at)).w(px(content_w)).child(child)),
        )
        .child(
            div()
                .relative()
                .w(px(view_w))
                .h(px(2.))
                .bg(alpha(theme.rule, 0.35))
                .child(
                    div()
                        .absolute()
                        .top_0()
                        .left(px(thumb_x))
                        .w(px(thumb_w))
                        .h(px(2.))
                        .bg(alpha(theme.accent, 0.6)),
                ),
        )
        .into_any_element()
}

/// Slide a wide block so the span `x0..x1` (design px) is in view, if it isn't already.
pub fn reveal_in_slide(
    id: &ElementId,
    x0: f32,
    x1: f32,
    view_w: f32,
    content_w: f32,
    window: &mut Window,
) {
    let max = (content_w - view_w).max(0.);
    let at = state::get::<Slide>(id).0.clamp(0., max);
    if x0 >= at && x1 <= at + view_w {
        return;
    }
    let to = (x0 - (view_w - (x1 - x0)) / 2.).clamp(0., max);
    state::update::<Slide>(id, window, |o| o.0 = to);
}

/// A diagram, drawn: asked for once the page is at full size (its width settles
/// then), shown as soon as its pixels arrive, its source in the meantime or if it can't be drawn.
fn diagram(src: &str, ctx: &Ctx) -> AnyElement {
    use super::diagram::{self, Diagram};
    let state = diagram::get(src, ctx.theme, ctx.width, ctx.scale);
    match state {
        Diagram::Ready {
            image,
            width,
            height,
        } => div()
            .w(px(width))
            .h(px(height))
            .mx_auto()
            .child(gpui::img(gpui::ImageSource::Render(image)).size_full())
            .into_any_element(),
        Diagram::Pending => div()
            .opacity(0.45)
            .child(code_block(src, Some("diagram"), true, ctx))
            .into_any_element(),
        Diagram::Failed => code_block(src, Some("diagram"), true, ctx),
    }
}

/// pele's playground with the diagram loaded: its source, form-urlencoded, in the fragment.
pub fn pele_playground(src: &str) -> String {
    format!(
        "https://pele.run/playground#source={}",
        form_urlencoded::byte_serialize(src.as_bytes()).collect::<String>()
    )
}

fn table(
    aligns: &[Align],
    head: &[Rich],
    rows: &[Vec<Rich>],
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    let cols = head
        .len()
        .max(rows.iter().map(Vec::len).max().unwrap_or(0))
        .max(1);
    // each column is at least as wide as its longest unbreakable word (hashes, addresses)
    let widths: Vec<f32> = (0..cols)
        .map(|i| {
            let cells = head
                .get(i)
                .into_iter()
                .chain(rows.iter().filter_map(|r| r.get(i)));
            let longest = cells.map(longest_word_px).fold(0f32, f32::max);
            (longest + 16.).clamp(90., 760.)
        })
        .collect();
    let natural: f32 = widths.iter().sum();
    let stretch = if natural < ctx.width {
        ctx.width / natural
    } else {
        1.
    };
    let widths: Vec<f32> = widths.iter().map(|w| (w * stretch).floor()).collect();
    let width: f32 = widths.iter().sum();
    let cell = |r: Option<&Rich>, i: usize, window: &mut Window, cx: &mut App| {
        let col_w = widths[i];
        let el = div()
            .w(px(col_w))
            .flex_none()
            .overflow_hidden()
            .px(px(8.))
            .py(px(6.));
        let el = match aligns.get(i).copied().unwrap_or(Align::None) {
            Align::Right => el.text_right(),
            Align::Center => el.text_center(),
            _ => el,
        };
        match r {
            Some(r) => el.child(ctx.with_width(col_w - 16., |c| rich(r, c, window, cx))),
            None => el,
        }
    };
    let mut grid = div().w(px(width)).flex().flex_col();
    if !head.is_empty() {
        let mut row = div()
            .flex()
            // the label style, as every other heading-in-small on the site
            .font_family(theme::SANS)
            .font_weight(gpui::FontWeight::MEDIUM)
            .text_size(px(12.))
            .line_height(px(20.))
            .letter_spacing(px(0.6))
            .text_color(theme.muted)
            .border_b_1()
            .border_color(theme.rule);
        for i in 0..cols {
            row = row.child(cell(head.get(i), i, window, cx));
        }
        grid = grid.child(row);
    }
    for (ri, r) in rows.iter().enumerate() {
        let mut row = div()
            .flex()
            .text_size(px(17.))
            .line_height(px(26.))
            .when(ri + 1 < rows.len(), |d| {
                d.border_b_1().border_color(alpha(theme.rule, 0.6))
            });
        for i in 0..cols {
            row = row.child(cell(r.get(i), i, window, cx));
        }
        grid = grid.child(row);
    }
    div()
        .border_t_1()
        .border_b_1()
        .border_color(theme.rule)
        .child(hscroll(ctx.id("table"), ctx.width, width, grid, theme))
        .into_any_element()
}

/// Rough width of the longest run without a break opportunity, in px at table sizes.
fn longest_word_px(r: &Rich) -> f32 {
    let mut best = 0f32;
    for (range, m) in &r.spans {
        let per = if m.code { 11. } else { 8.5 };
        for word in r.text[range.clone()].split_whitespace() {
            best = best.max(word.chars().count() as f32 * per);
        }
    }
    best
}

fn reveal(
    label_text: &str,
    body: &[Block],
    ctx: &Ctx,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let theme = ctx.theme;
    let id = ctx.id("reveal");
    let is_open = state::get::<bool>(&id);
    let key = id.clone();
    let accent = theme.accent;
    let header = div()
        .id(id)
        .cursor_pointer()
        .flex()
        .items_baseline()
        .gap(px(10.))
        .text_color(theme.ink)
        .hover(move |s| s.text_color(accent))
        .child(
            div()
                .w(px(14.))
                .font_family(theme::DISPLAY)
                .text_color(theme.accent)
                .child(if is_open { "–" } else { "+" }),
        )
        .child(div().italic().child(label_text.to_string()))
        .on_click(move |_, window, _| state::update::<bool>(&key, window, |o| *o = !*o));
    div()
        .flex()
        .flex_col()
        .gap(px(10.))
        .child(header)
        .when(is_open, |d| {
            d.child(
                div()
                    .ml(px(6.))
                    .pl(px(18.))
                    .border_l_1()
                    .border_color(theme.rule)
                    .child(ctx.with_width(ctx.width - 24., |c| stack(body, c, window, cx))),
            )
        })
        .into_any_element()
}

/// A component that lives elsewhere (wallets, iframes): a lettered card that links out.
fn link_out(title: &str, text: &str, cta: &str, href: &str, ctx: &Ctx) -> AnyElement {
    let theme = ctx.theme;
    div()
        .py(px(14.))
        .border_t_1()
        .border_b_1()
        .border_color(theme.rule)
        .flex()
        .flex_col()
        .gap(px(6.))
        .child(label(title.to_uppercase(), theme.accent))
        .child(
            div()
                .italic()
                .text_size(px(17.))
                .line_height(px(27.))
                .child(text.to_string()),
        )
        .child(super::link(
            ctx.id("out"),
            &format!("→ {cta}"),
            href,
            ctx.nav,
            theme,
        ))
        .into_any_element()
}

pub fn muted_note(text: &str, ctx: &Ctx) -> AnyElement {
    div()
        .pl(px(12.))
        .border_l_1()
        .border_color(ctx.theme.rule)
        .font_family(theme::MONO)
        .text_size(px(13.))
        .line_height(px(20.))
        .text_color(ctx.theme.muted)
        .child(text.to_string())
        .into_any_element()
}

fn footnotes(notes: &[Footnote], ctx: &Ctx, window: &mut Window, cx: &mut App) -> AnyElement {
    let theme = ctx.theme;
    div()
        .pt(px(12.))
        .flex()
        .flex_col()
        .gap(px(8.))
        .text_size(px(16.))
        .line_height(px(25.))
        .child(div().w(px(120.)).h(px(1.)).bg(theme.rule))
        .children(notes.iter().map(|n| {
            div()
                .flex()
                .child(
                    div()
                        .w(px(30.))
                        .flex_none()
                        .text_color(theme.accent)
                        .child(format!("{}.", n.number)),
                )
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .child(ctx.with_width(ctx.width - 30., |c| {
                            div()
                                .flex()
                                .flex_col()
                                .gap(px(6.))
                                .children(blocks(&n.body, c, window, cx))
                        })),
                )
        }))
        .into_any_element()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn playground_link() {
        assert_eq!(
            pele_playground("flowchart LR\n  A[Web app] --> B"),
            "https://pele.run/playground#source=flowchart+LR%0A++A%5BWeb+app%5D+--%3E+B"
        );
    }
}

/// Room in the column for a web component, at its measured height, and a probe telling
/// `dom_embed` where it's painted.
fn embed_block(
    embed: &'static crate::dom_embed::Embed,
    props: &[(String, String)],
    ctx: &Ctx,
) -> AnyElement {
    use crate::dom_embed;
    let key = dom_embed::next_key(embed.component);
    // the room kept is a floor: a component loading (a line of text) or giving up is shorter
    // than what it grows into, and the column shouldn't shrink under the reader and grow back
    let height = dom_embed::height(&key).map_or(embed.height, |h| h.max(embed.height));
    let props = props.to_vec();
    let t = &ctx.theme;
    let css = crate::theme::Theme::css;
    let style = format!(
        "color:{fg};--color-fg:{fg};--color-muted:{muted};--color-border:{rule};--font-mono:ui-monospace,Menlo,monospace;font:400 15px/1.55 site-sans,system-ui,sans-serif;",
        fg = css(t.ink),
        muted = css(t.muted),
        rule = css(t.rule),
    );
    div()
        .relative()
        .w(px(ctx.width))
        .h(gpui::px(height))
        .child(
            div().absolute().inset_0().child(
                gpui::canvas(
                    move |bounds, window, _| {
                        let clip = window.content_mask().bounds;
                        let rect = crate::overlay::Rect::from_bounds(bounds);
                        dom_embed::place(
                            &key,
                            embed,
                            &props,
                            &style,
                            rect,
                            crate::overlay::Rect::from_bounds(clip),
                        );
                    },
                    |_, _, _, _| {},
                )
                .size_full(),
            ),
        )
        .into_any_element()
}
