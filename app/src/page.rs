use gpui::prelude::*;
use gpui::{Context, Entity, ScrollHandle, Window, div};

use crate::content::near::{self, NearCache};

use gpui::px;

use crate::api::{Navigate, RoutePayload};
use crate::content;
use crate::design;
use crate::overlay::{Margins, Probe, Redraw, Stage};
use crate::select::Selection;
use crate::theme::{self, Theme};

pub enum Load {
    Loading,
    Ready(RoutePayload),
    Failed,
}

pub struct Page {
    pub load: Load,
    path: String,
    nav: Navigate,
    scroll: ScrollHandle,
    pub probe: Probe,
    dark: Option<bool>,
    shown: f32,
    covered: bool,
    images: Entity<NearCache>,
    pending: bool,
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
            covered: false,
            images: NearCache::new(cx),
            pending: false,
            selection: Selection::new(),
        }
    }

    pub fn loading(&mut self, cx: &mut Context<Self>) {
        self.pending = true;
        cx.notify();
    }

    pub fn keep(&mut self, cx: &mut Context<Self>) {
        self.pending = false;
        cx.notify();
    }

    pub fn set(&mut self, load: Load, cx: &mut Context<Self>) {
        self.load = load;
        self.path = crate::route::current();
        self.pending = false;
        self.images = NearCache::new(cx);
        content::forget_page();
        self.scroll.set_offset(gpui::point(px(0.), px(0.)));
        cx.notify();
    }

    pub fn has_content(&self) -> bool {
        matches!(self.load, Load::Ready(_) | Load::Failed)
    }

    pub fn set_shown(&mut self, shown: f32, cx: &mut Context<Self>) {
        if (shown - self.shown).abs() > 0.001 {
            self.shown = shown;
            cx.notify();
        }
    }

    pub fn set_covered(&mut self, covered: bool, cx: &mut Context<Self>) {
        if self.covered != covered {
            self.covered = covered;
            if covered {
                crate::dom_embed::hide_all();
            }
            cx.notify();
        }
    }

    pub fn hidden(&mut self, cx: &mut Context<Self>) {
        crate::dom_video::clear();
        self.selection.reset(cx);
    }

    pub fn ready(&self) -> bool {
        !self.pending && !matches!(self.load, Load::Loading)
    }

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
        let stage = Stage {
            hidden: self.covered || self.shown <= 0.99,
            under_controls: design::controls_cover_column(window).then(|| {
                let [top, _, bottom, _] = crate::browser::safe_insets();
                Margins { top, bottom }
            }),
        };
        crate::dom_embed::begin_render(&self.path, stage);
        crate::dom_video::turn_to(&self.path, stage);
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
        crate::mark(&format!(
            "page render {:.2}ms",
            started.elapsed().as_secs_f64() * 1e3
        ));
        let top = if design::is_phone(window) {
            108.0
        } else {
            112.0
        } + crate::browser::safe_insets()[0];
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
                    .px(gpui::px(content::page_gutter(window)))
                    .pt(gpui::px(top))
                    .pb(gpui::px(120. + crate::browser::safe_insets()[2]))
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
