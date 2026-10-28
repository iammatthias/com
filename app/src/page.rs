//! A content page: the scrolling reading column, and the probe the plate
//! frames. Rendered as a cached view, so the plate can animate every frame without
//! the article being laid out again.

use gpui::prelude::*;
use gpui::{Context, Entity, ScrollHandle, Window, div};

use crate::content::near::{self, NearCache};

use gpui::px;

use crate::api::{Navigate, RoutePayload};
use crate::content;
use crate::design;
use crate::overlay::{Probe, Redraw};
use crate::select::Selection;
use crate::theme::{self, Theme};

pub enum Load {
    Loading,
    Ready(RoutePayload),
    /// it didn't load (why is in the console)
    Failed,
}

pub struct Page {
    pub load: Load,
    /// the path `load` is for (the address moves on before the next one is in)
    path: String,
    nav: Navigate,
    scroll: ScrollHandle,
    pub probe: Probe,
    dark: Option<bool>,
    /// how far the text has faded up, 0..1
    shown: f32,
    /// this page's decoded images; replaced (and so freed) when the next page loads
    images: Entity<NearCache>,
    /// the next route is loading; what's showing is the previous page
    pending: bool,
    /// the text the reader has selected, if any; cleared when the path changes
    selection: Selection,
}

impl Page {
    pub fn new(nav: Navigate, cx: &mut Context<Self>) -> Self {
        Self {
            load: Load::Loading,
            path: String::new(),
            nav,
            scroll: ScrollHandle::new(),
            probe: Probe::default(),
            dark: None,
            shown: 0.0,
            images: NearCache::new(cx),
            pending: false,
            selection: Selection::new(),
        }
    }

    /// A new route is on its way. The current page stays up until it arrives, so the frame
    /// never stands empty; `ready()` turns false until then.
    pub fn loading(&mut self, cx: &mut Context<Self>) {
        self.pending = true;
        cx.notify();
    }

    /// The route on its way went elsewhere (a redirect off the site): what's showing stays.
    pub fn keep(&mut self, cx: &mut Context<Self>) {
        self.pending = false;
        cx.notify();
    }

    /// The new route's content: swap it in at the top, with a fresh image cache
    /// (a phone can't hold every gallery it has seen).
    pub fn set(&mut self, load: Load, cx: &mut Context<Self>) {
        self.load = load;
        // Site sets a payload only for the route the address now shows
        self.path = crate::route::current();
        self.pending = false;
        self.images = NearCache::new(cx);
        content::forget_page();
        self.scroll.set_offset(gpui::point(px(0.), px(0.)));
        cx.notify();
    }

    /// Some page is showing (the current one, or the last while the next loads).
    pub fn has_content(&self) -> bool {
        matches!(self.load, Load::Ready(_) | Load::Failed)
    }

    /// Fade the text: re-renders (breaking the cache) only while the value moves.
    pub fn set_shown(&mut self, shown: f32, cx: &mut Context<Self>) {
        if (shown - self.shown).abs() > 0.001 {
            self.shown = shown;
            cx.notify();
        }
    }

    /// The page is off the screen (the plate shows alone): its selection goes with it.
    pub fn hidden(&mut self, cx: &mut Context<Self>) {
        self.selection.reset(cx);
    }

    pub fn ready(&self) -> bool {
        !self.pending && !matches!(self.load, Load::Loading)
    }

    /// Re-render when the system switches between light and dark.
    pub fn follow_appearance(&mut self, dark: bool, cx: &mut Context<Self>) {
        if self.dark != Some(dark) {
            self.dark = Some(dark);
            cx.notify();
        }
    }
}

impl Render for Page {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = Theme::of(window, cx);
        let started = web_time::Instant::now();
        for image in crate::content::diagram::take_evicted() {
            let _ = cx.drop_image(image, Some(window));
        }
        near::watch(cx.weak_entity(), window);
        self.images
            .update(cx, |images, cx| images.sweep(window, cx));
        // whatever is showing, a page that failed included: the last page's embeds go
        crate::dom_embed::begin_render(&self.path);
        let body = match &self.load {
            Load::Loading => div().into_any_element(),
            Load::Failed => {
                let (nav, path, accent) = (self.nav.clone(), self.path.clone(), theme.accent);
                content::column(&theme)
                    .child(content::heading("The page would not load", &theme))
                    .child(
                        div()
                            .text_color(theme.muted)
                            .child("The connection dropped, or the site didn't answer."),
                    )
                    .child(
                        div()
                            .id("page:retry")
                            .cursor_pointer()
                            .italic()
                            .text_color(theme.ink)
                            .hover_style(move |s| s.text_color(accent))
                            .child("Try again →")
                            .on_click(move |_, window, cx| nav(path.clone(), window, cx)),
                    )
                    .into_any_element()
            }
            Load::Ready(payload) => {
                content::view(payload, &self.nav, &theme, &self.selection, window, cx)
            }
        };
        crate::overlay::set_page_shown(self.shown > 0.99);
        // how long building the page's element tree took, in the #perf log
        crate::mark(&format!(
            "page render {:.2}ms",
            started.elapsed().as_secs_f64() * 1e3
        ));
        // clear of the controls, with air between them and the page (the frame round it comes
        // down with it), and of the status bar and notch the canvas reaches under
        let top = if design::is_phone(window) {
            108.0
        } else {
            112.0
        } + crate::route::safe_insets()[0];
        crate::theme::with_fallbacks(div())
            .size_full()
            .image_cache(self.images.clone())
            .opacity(self.shown)
            .flex()
            .flex_col()
            .text_color(theme.ink)
            .font_family(theme::BODY)
            .child(
                div()
                    .id("page")
                    .flex_1()
                    .overflow_y_scroll()
                    .track_scroll(&self.scroll)
                    .px(gpui::px(if design::is_phone(window) { 22.0 } else { 48.0 }))
                    .pt(gpui::px(top))
                    .pb(gpui::px(120. + crate::route::safe_insets()[2]))
                    .child(
                        div()
                            .relative()
                            .w_full()
                            .max_w(px(design::COLUMN_MAX_W))
                            .mx_auto()
                            .child(
                                self.selection
                                    .scope(self.path.clone(), body, theme.selection())
                                    .pill_clearance(gpui::px(top)),
                            )
                            .child(self.probe.element(Redraw::NextFrame)),
                    ),
            )
    }
}
