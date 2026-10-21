//! The controls on the plate's corners: the panels (menu, site, find), each a pill that opens
//! into a card, the small widgets inside them, and the pill the home button shares.

use gpui::prelude::*;
use gpui::{AnyElement, Context, Window, div, px};

use crate::api::{Index, Navigate};
use crate::content;
use crate::design;
use crate::home::{Home, note_line};
use crate::prefs;
use crate::site::Site;
use crate::theme::{self, Choice, Theme};

/// The panels on the plate's corners: where to go (top right), the plate's controls (bottom
/// left), and search (bottom right). Home sits top left.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Drawer {
    Menu,
    Site,
    Find,
}

impl Drawer {
    pub const ALL: [Drawer; 3] = [Drawer::Menu, Drawer::Site, Drawer::Find];
    pub fn index(self) -> usize {
        match self {
            Drawer::Menu => 0,
            Drawer::Site => 1,
            Drawer::Find => 2,
        }
    }
    pub fn label(self) -> &'static str {
        match self {
            Drawer::Menu => "menu",
            Drawer::Site => "site",
            Drawer::Find => "find",
        }
    }
    /// opens upward from the bottom of the screen
    pub fn from_bottom(self) -> bool {
        self != Drawer::Menu
    }
    /// on the right-hand side
    pub fn on_right(self) -> bool {
        self != Drawer::Site
    }
}

/// What the site panel shows about the plate right now.
#[derive(Clone)]
pub struct PlateState {
    pub zoom: u32,
    pub seed: u32,
    pub motion: bool,
}

fn label(text: &str, theme: &Theme) -> impl IntoElement {
    crate::content::label(text.to_uppercase(), theme.muted)
}

fn field(name: &str, theme: &Theme, body: impl IntoElement) -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .gap(px(6.))
        .child(label(name, theme))
        .child(body)
}

/// A bordered button in the display face.
fn button(id: impl Into<gpui::ElementId>, text: &str, theme: &Theme) -> gpui::Stateful<gpui::Div> {
    let t = *theme;
    div()
        .id(id)
        .px(px(9.))
        .py(px(4.))
        .border_1()
        .border_color(t.edge())
        .rounded_full()
        .cursor_pointer()
        .font_family(theme::SANS)
        .text_size(px(14.))
        .text_color(t.ink)
        .hover(move |s| s.text_color(t.accent))
        .child(text.to_string())
}

/// A row of mutually exclusive buttons, pressed one inked.
fn segmented<T: Clone + PartialEq + 'static>(
    id: &'static str,
    options: &[(&'static str, T)],
    current: &T,
    theme: &Theme,
    cx: &mut Context<Site>,
    on_pick: impl Fn(&mut Site, T, &mut Context<Site>) + Clone + 'static,
) -> AnyElement {
    let theme = *theme;
    div()
        .flex()
        .p(px(3.))
        .gap(px(2.))
        .border_1()
        .border_color(theme.edge())
        .rounded_full()
        .children(options.iter().enumerate().map(|(i, (name, value))| {
            let pressed = value == current;
            let value = value.clone();
            let on_pick = on_pick.clone();
            div()
                .id((id, i))
                .flex_1()
                .px(px(8.))
                .py(px(4.))
                .rounded_full()
                .cursor_pointer()
                .font_family(theme::SANS)
                .text_size(px(14.))
                .text_center()
                .when(pressed, |d| d.bg(theme.ink).text_color(theme.paper))
                .when(!pressed, |d| {
                    d.text_color(theme.ink)
                        .hover(move |s| s.text_color(theme.accent))
                })
                .child(*name)
                .on_click(cx.listener(move |site, _, _, cx| on_pick(site, value.clone(), cx)))
        }))
        .into_any_element()
}

/// A panel between closed and open: `k` eases 0 → 1, and the card grows from its closed
/// pill to `open_w` × (header + the body's natural height), the body laid out at full width
/// throughout so nothing reflows as it opens.
pub struct MenuAnim {
    pub k: f32,
    pub width: f32,
    pub open_w: f32,
    pub body_h: f32,
    pub max_body_h: f32,
    pub body: crate::overlay::Probe,
}

const DRAWERS: usize = Drawer::ALL.len();

/// The panels' motion: each one's openness, eased toward open or closed, and the measures its
/// card grows between.
pub struct Drawers {
    k: [f32; DRAWERS],
    /// when they last moved
    at: web_time::Instant,
    /// each panel body's natural size, measured as it opens
    body: [crate::overlay::Probe; DRAWERS],
    /// each closed pill's width
    closed_w: [f32; DRAWERS],
    /// each panel, drawn by the plate as a pane of glass
    glass: [crate::overlay::Probe; DRAWERS],
}

impl Default for Drawers {
    fn default() -> Self {
        Self {
            k: [0.0; DRAWERS],
            at: web_time::Instant::now(),
            body: Default::default(),
            closed_w: [80.0; DRAWERS],
            glass: Default::default(),
        }
    }
}

impl Drawers {
    /// Ease each panel toward open (the one `open`) or closed, and put its glass where this
    /// frame draws it.
    pub fn step(&mut self, open: Option<Drawer>, window: &mut Window) {
        let now = web_time::Instant::now();
        // `#slowui`: a tenth of the speed, to see the motion frame by frame
        let pace = if crate::route::debug::slow_ui() {
            0.1
        } else {
            1.0
        };
        let dt = (now - self.at).as_secs_f32().min(0.1) * pace;
        self.at = now;
        let vp = window.viewport_size();
        let (vw, vh) = (f32::from(vp.width), f32::from(vp.height));
        let insets = crate::route::safe_insets();
        for which in Drawer::ALL {
            let i = which.index();
            let target = if open == Some(which) { 1.0 } else { 0.0 };
            if (target - self.k[i]).abs() < 0.002 {
                self.k[i] = target;
            } else {
                self.k[i] += (target - self.k[i]) * (1.0 - (-dt * 13.0).exp());
                window.request_animation_frame();
            }
            if self.k[i] <= 0.001 {
                if let Some(b) = self.glass[i].bounds() {
                    self.closed_w[i] = f32::from(b.size.width);
                }
                continue;
            }
            let a = self.anim(which, window);
            let h = design::CONTROL_H + a.body_h.min(a.max_body_h) * a.k;
            let x = if which.on_right() {
                vw - design::INSET - a.width
            } else {
                design::INSET
            };
            let y = if which.from_bottom() {
                vh - design::INSET - insets[2] - h
            } else {
                design::INSET + insets[0]
            };
            self.glass[i].set(gpui::Bounds::new(
                gpui::point(px(x), px(y)),
                gpui::size(px(a.width), px(h)),
            ));
        }
    }

    pub fn anim(&self, which: Drawer, window: &Window) -> MenuAnim {
        let vp = window.viewport_size();
        let (vw, vh) = (f32::from(vp.width), f32::from(vp.height));
        let i = which.index();
        let open_w = design::PANEL_W.min(vw - 2.0 * design::INSET);
        let k = self.k[i];
        let closed = self.closed_w[i];
        MenuAnim {
            k,
            // the width arrives early, so the body is revealed along its length, never cut at the side
            width: closed + (open_w - closed) * (k * 2.2).min(1.0),
            open_w,
            body_h: self.body[i]
                .size()
                .map(|s| f32::from(s.height))
                .unwrap_or(420.0),
            max_body_h: (vh
                - 88.0
                - crate::route::safe_insets()[0]
                - crate::route::safe_insets()[2])
                .min(640.0)
                .max(160.0),
            body: self.body[i].clone(),
        }
    }

    /// A panel is open, opening or closing.
    pub fn any_shown(&self) -> bool {
        self.k.iter().any(|k| *k > 0.001)
    }

    /// On a phone an open panel spans the width: the other controls step aside (and leave no
    /// glass) until it closes.
    pub fn crowded(&self, window: &Window) -> Option<Drawer> {
        if !design::is_phone(window) {
            return None;
        }
        Drawer::ALL.into_iter().find(|d| self.k[d.index()] > 0.001)
    }

    pub fn glass(&self, which: Drawer) -> &crate::overlay::Probe {
        &self.glass[which.index()]
    }

    /// Every panel's glass, in `Drawer::ALL` order.
    pub fn panes(&self) -> &[crate::overlay::Probe] {
        &self.glass
    }
}

/// What a pill is drawn on.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum PillFace {
    /// Plain paper.
    Solid,
    /// The engraving.
    Glass,
    /// The engraving, with a page's text under it.
    GlassOverText,
}

/// A control on the plate: a rounded pill, `CONTROL_H` tall, its name in the script face. Over the engraving the
/// plate draws it as glass, so it paints only its text; on plain paper it is a solid pill.
pub fn pill(t: &Theme, face: PillFace) -> gpui::Div {
    div()
        .flex()
        .items_center()
        .h(px(design::CONTROL_H))
        .px(px(18.))
        .when(face == PillFace::Solid, |d| {
            d.bg(t.veil(0.82)).border_1().border_color(t.edge())
        })
        // the glass lies under the page, so over a page's text it needs a veil of its own
        .when(face == PillFace::GlassOverText, |d| {
            d.bg(t.veil(0.8)).border_1().border_color(gpui::Rgba {
                alpha: 0.7,
                ..gpui::rgb(0xffffff)
            })
        })
        .rounded(px(design::CONTROL_RADIUS))
        .cursor_pointer()
        // the plate's own hand
        .font_family(theme::SCRIPT)
        .text_size(px(design::SCRIPT_BUTTON_SIZE))
        .text_color(t.ink)
}

/// What every panel reads to draw itself.
pub struct PanelInputs<'a> {
    pub home: &'a Home,
    pub on_home: bool,
    pub plate: Option<&'a PlateState>,
    pub semantic: Option<&'a [crate::search::Hit]>,
    pub index: Option<&'a Index>,
    pub nav: &'a Navigate,
    pub theme: &'a Theme,
}

/// One panel in a corner: its header (name and +/−), and while it opens or is open, its body.
pub fn drawer(
    which: Drawer,
    p: &PanelInputs,
    glass: &crate::overlay::Probe,
    anim: &MenuAnim,
    cx: &mut Context<Site>,
) -> AnyElement {
    let t = *p.theme;
    // glass needs the plate under it: over plain paper it is a solid pill
    let on_glass = !p.home.plain;
    // over a page's text (a phone, where the controls cover the column) the glass, drawn under
    // the page, needs a veil; elsewhere it floats in the margins, clear
    let over_text = !p.on_home && crate::route::narrow();
    let open = p.home.open == Some(which);
    let header = div()
        .id(("drawer-head", which.index()))
        .flex()
        .items_center()
        .justify_between()
        .gap(px(14.))
        .h(px(design::CONTROL_H))
        .px(px(18.))
        .cursor_pointer()
        .font_family(theme::SCRIPT)
        .text_size(px(design::SCRIPT_BUTTON_SIZE))
        .hover(move |s| s.text_color(t.accent))
        .child(which.label())
        .child(
            div()
                .font_family(theme::SANS)
                .text_size(px(15.))
                .text_color(t.muted)
                .child(if open { "–" } else { "+" }),
        )
        .on_click(cx.listener(move |site, _, _, cx| {
            site.home.open = if site.home.open == Some(which) {
                None
            } else {
                Some(which)
            };
            if which == Drawer::Find && site.home.open == Some(which) {
                // focused within this tap, the only moment a phone will raise its keyboard for it
                site.focus_search(cx);
            }
            cx.notify();
        }));

    let insets = crate::route::safe_insets();
    let card = div()
        .id(("drawer", which.index()))
        .occlude()
        .font_family(theme::BODY)
        .absolute()
        .when(!which.from_bottom(), |d| {
            d.top(px(design::INSET + insets[0]))
        })
        .when(which.from_bottom(), |d| {
            d.bottom(px(design::INSET + insets[2]))
        })
        .when(which.on_right(), |d| d.right(px(design::INSET)))
        .when(!which.on_right(), |d| d.left(px(design::INSET)))
        .flex()
        // the name and its +/− head the panel: from a bottom corner the panel grows upward and
        // the header rides its top edge
        .flex_col()
        .when(which.on_right(), |d| d.items_end())
        .when(!which.on_right(), |d| d.items_start())
        .when(!on_glass, |d| {
            d.bg(t.veil(0.82)).border_1().border_color(t.edge())
        })
        // over a page the text would show through the glass (drawn under it): veil it
        .when(
            on_glass && (over_text || (!p.on_home && anim.k > 0.001)),
            |d| {
                d.bg(t.veil(if anim.k > 0.001 { 1.0 } else { 0.8 }))
                    .border_1()
                    .border_color(gpui::Rgba {
                        alpha: 0.7,
                        ..gpui::rgb(0xffffff)
                    })
            },
        )
        .rounded(px(design::CONTROL_RADIUS))
        .overflow_hidden()
        .text_color(t.ink)
        .child(glass.element(crate::overlay::Redraw::Refresh))
        .child(header.w_full());
    if anim.k <= 0.001 {
        return card.into_any_element();
    }
    let card = card.w(px(anim.width));

    let body = div()
        .px(px(14.))
        .pt(px(2.))
        .pb(px(16.))
        .flex()
        .flex_col()
        .gap(px(14.))
        .font_family(theme::BODY);
    let body = match which {
        Drawer::Menu => menu_body(body, p),
        Drawer::Site => site_body(body, p, cx),
        Drawer::Find => find_body(body, p, cx),
    };

    let body = div()
        .flex_none()
        .w(px(anim.open_w))
        .relative()
        .child(body)
        .child(anim.body.element(crate::overlay::Redraw::NextFrame));
    let shown = anim.body_h.min(anim.max_body_h);
    let frame = if anim.k >= 0.999 {
        div()
            .id(("drawer-body", which.index()))
            .w(px(anim.open_w))
            .max_h(px(anim.max_body_h))
            .overflow_y_scroll()
    } else {
        div()
            .id(("drawer-body", which.index()))
            .w(px(anim.open_w))
            .h(px(shown * anim.k))
            .overflow_hidden()
    };
    card.child(frame.opacity(anim.k * anim.k).child(body))
        .into_any_element()
}

/// Where to go: the whole site, grouped as @com's /menu groups it (the first, unnamed group is
/// home, which has its own button), then elsewhere.
fn menu_body(body: gpui::Div, p: &PanelInputs) -> gpui::Div {
    let (t, index, nav) = (*p.theme, p.index, p.nav);
    // each group as a line of an index: its name in the label's small capitals on the left,
    // its places in the reading serif on the right, wrapping under themselves
    let link_row = |key: &'static str, i: usize, label: &str, href: &str| {
        content::link((key, i), label, href, nav, &t)
            .font_family(theme::BODY)
            .text_size(px(17.))
            .line_height(px(26.))
    };
    let group = |name: &str, links: gpui::Div| {
        div()
            .flex()
            .items_start()
            .gap(px(12.))
            .child(
                div()
                    .w(px(100.))
                    .flex_none()
                    .pt(px(4.))
                    .child(crate::content::label(name.to_uppercase(), t.muted)),
            )
            .child(links.flex_1().min_w_0().flex().flex_wrap().gap_x(px(12.)))
    };
    let groups = index.map(|i| i.menu.clone()).unwrap_or_default();
    let mut n = 0usize;
    let mut list = div().flex().flex_col().gap(px(10.));
    for g in groups.iter().filter(|g| !g.group.is_empty()) {
        let links = div().children(g.links.iter().map(|l| {
            n += 1;
            link_row("menu-link", n, &l.label, &l.href)
        }));
        list = list.child(group(&g.group, links));
    }
    if let Some(index) = index.filter(|i| !i.elsewhere.is_empty()) {
        let links = div().children(
            index
                .elsewhere
                .iter()
                .enumerate()
                .map(|(i, l)| link_row("elsewhere", i, &l.label, &l.href)),
        );
        list = list
            .child(div().h(px(1.)).bg(t.edge()))
            .child(group("Elsewhere", links));
    }
    body.child(list)
}

/// The plate's controls, the sections, and the theme.
fn site_body(mut body: gpui::Div, p: &PanelInputs, cx: &mut Context<Site>) -> gpui::Div {
    let (t, home, index) = (*p.theme, p.home, p.index);
    // View: the engraving (the spiral on the home page, the line framing every page), or plain
    // paper (the index as a list, pages without the shader)
    body = body.child(field(
        "View",
        &t,
        segmented(
            "view",
            &[("Engraved", false), ("Plain", true)],
            &home.plain,
            &t,
            cx,
            |site, plain, cx| {
                site.set_plain(plain, cx);
            },
        ),
    ));

    if let Some(plate) = p.plate.filter(|_| p.on_home && !home.plain) {
        body = body.child(field(
            "Zoom",
            &t,
            div()
                .flex()
                .items_center()
                .gap(px(6.))
                .child(
                    button("zoom-in", "+", &t)
                        .font_family(theme::MONO)
                        .on_click(cx.listener(|site, _, _, cx| site.plate_zoom(1.4, cx))),
                )
                .child(
                    button("zoom-out", "−", &t)
                        .font_family(theme::MONO)
                        .on_click(cx.listener(|site, _, _, cx| site.plate_zoom(1.0 / 1.4, cx))),
                )
                .child(
                    button("zoom-reset", "Reset", &t)
                        .on_click(cx.listener(|site, _, _, cx| site.plate_zoom(0.0, cx))),
                )
                .child(
                    div()
                        .ml_auto()
                        .font_family(theme::MONO)
                        .text_size(px(12.))
                        .text_color(t.muted)
                        .child(format!("{}%", plate.zoom)),
                ),
        ));
    }

    if let Some(plate) = p.plate.filter(|_| !home.plain) {
        body = body
            .child(field(
                "Seed",
                &t,
                div()
                    .flex()
                    .items_center()
                    .gap(px(8.))
                    .child(
                        div()
                            .mr_auto()
                            .font_family(theme::MONO)
                            .text_size(px(14.))
                            .child(format!("{:08x}", plate.seed)),
                    )
                    .child(
                        button("new-plate", "New plate", &t)
                            .on_click(cx.listener(|site, _, _, cx| site.new_plate(cx))),
                    ),
            ))
            .child(field(
                "Animation",
                &t,
                segmented(
                    "motion",
                    &[("On", true), ("Still", false)],
                    &plate.motion,
                    &t,
                    cx,
                    |site, on, cx| {
                        site.set_motion(on, cx);
                    },
                ),
            ));
    }

    let mut sections: Vec<(String, Option<String>)> = vec![("All".into(), None)];
    if let Some(index) = index {
        sections.extend(
            index
                .sections
                .iter()
                .filter(|s| s.count > 0)
                .map(|s| (s.name.clone(), Some(s.slug.clone()))),
        );
    }
    let chips =
        div()
            .flex()
            .flex_wrap()
            .gap(px(6.))
            .children(sections.into_iter().enumerate().map(|(i, (name, slug))| {
                let pressed = slug == home.section;
                // each section in its colour, as its titles are written on the plate
                let hue = slug.as_deref().map(|s| t.section(s)).unwrap_or(t.ink);
                div()
                    .id(("section", i))
                    .flex()
                    .items_center()
                    .gap(px(6.))
                    .px(px(11.))
                    .py(px(4.))
                    .border_1()
                    .border_color(t.edge())
                    .rounded_full()
                    .cursor_pointer()
                    .font_family(theme::SANS)
                    .text_size(px(13.))
                    .when(pressed, |d| d.bg(t.ink).text_color(t.paper))
                    .when(slug.is_some(), |d| {
                        d.child(div().size(px(7.)).rounded_full().bg(hue))
                    })
                    .child(name)
                    .on_click(
                        cx.listener(move |site, _, _, cx| site.pick_section(slug.clone(), cx)),
                    )
            }));
    body = body.child(field("Sections", &t, chips));

    let choice = cx.try_global::<Choice>().copied().unwrap_or_default();
    body.child(field(
        "Theme",
        &t,
        segmented(
            "paper",
            &[
                ("System", Choice::System),
                ("Light", Choice::Light),
                ("Dark", Choice::Dark),
            ],
            &choice,
            &t,
            cx,
            |_, choice, cx| {
                prefs::set("theme", choice.key());
                cx.set_global(choice);
                cx.refresh_windows();
            },
        ),
    ))
}

/// Find a title: a focusable field that reads keystrokes itself; matches open in place.
fn find_body(body: gpui::Div, p: &PanelInputs, cx: &mut Context<Site>) -> gpui::Div {
    let (t, home, index) = (*p.theme, p.home, p.index);
    let focused = crate::dom_input::focused();
    // the field's box is drawn here; the text in it is a native input laid over it (dom_input)
    let query = home.query.clone();
    let style = format!(
        "color:{ink};caret-color:{accent};font:400 15px/1.2 site-sans,system-ui,sans-serif;",
        ink = theme::Theme::css(t.ink),
        accent = theme::Theme::css(t.accent),
    );
    let find = div().flex().flex_col().gap(px(4.)).child(
        div()
            .id("find")
            .cursor_text()
            .w_full()
            .h(px(36.))
            .border_1()
            .border_color(if focused { t.ink } else { t.rule })
            .rounded_full()
            .relative()
            .child(
                div().absolute().inset_0().child(
                    gpui::canvas(
                        move |bounds, window, _| {
                            let clip = window.content_mask().bounds;
                            crate::dom_input::place(
                                crate::overlay::Rect::from_bounds(bounds),
                                crate::overlay::Rect::from_bounds(clip),
                                &query,
                                "pizza, agents, atproto…",
                                crate::site::MAX_QUERY,
                                &style,
                            );
                        },
                        |_, _, _, _| {},
                    )
                    .size_full(),
                ),
            )
            .on_click(cx.listener(|site, _, _, cx| site.focus_search(cx))),
    );
    // a steady room for results, so the panel doesn't jump as they come and go
    let mut results = div().h(px(8. * 26. + 4.)).flex().flex_col();
    if home.query.trim().is_empty() {
        results = results.child(
            div()
                .pt(px(4.))
                .italic()
                .text_size(px(15.))
                .line_height(px(22.))
                .text_color(t.muted)
                .child("Titles and tags, or what something is about."),
        );
    }
    if !home.query.trim().is_empty() {
        // what the words match first (titles and tags), then what the meaning finds, once each
        let mut shown: Vec<(String, String)> = index
            .map(|ix| {
                home.matches(ix)
                    .into_iter()
                    .map(|it| (it.title.clone(), it.href.clone()))
                    .collect()
            })
            .unwrap_or_default();
        for h in p.semantic.unwrap_or_default() {
            if shown.iter().any(|(_, href)| *href == h.href) {
                continue;
            }
            // feed notes have no titles: name them by their words, or when a picture was posted
            let title = index
                .and_then(|ix| ix.feed.iter().find(|f| f.href == h.href))
                .map(|f| note_line(&f.excerpt, &f.created_at))
                .unwrap_or_else(|| h.title.clone());
            shown.push((title, h.href.clone()));
        }
        if shown.is_empty() {
            results = results.child(
                div()
                    .pt(px(4.))
                    .italic()
                    .text_size(px(15.))
                    .text_color(t.muted)
                    .child("Nothing matches."),
            );
        }
        results = results.children(shown.into_iter().take(8).enumerate().map(
            |(i, (title, href))| {
                div()
                    .font_family(theme::BODY)
                    .italic()
                    .text_size(px(17.))
                    .line_height(px(26.))
                    .child(content::link(("hit", i), &title, &href, p.nav, &t))
            },
        ));
    }
    body.child(find.gap(px(10.)).child(results))
}
