use std::rc::Rc;

use gpui::prelude::*;
use gpui::{App, Context, Entity, StyleRefinement, Subscription, Task, Window, div};

use crate::api::{Index, Navigate, RoutePayload};
use crate::design;
use crate::drawers::{self, Drawer, Drawers, PlateState};
use crate::home::{self, Home};
use crate::page::{Load, Page};
use crate::plate::{Greeted, Plate, Title};
use crate::prefs;
use crate::route::{self, Route};
use crate::seed::{self, Visitor};
use crate::theme::Theme;

mod find;
mod lettering;
mod payloads;
mod remote;
mod reveal;
pub mod signal;
mod timeline;

use crate::http::{self, Retry};
use find::Find;
pub use find::MAX_QUERY;
use lettering::Lettering;
use payloads::Payloads;
use remote::Remote;
use reveal::Reveal;
use signal::pump;
use timeline::Timeline;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Arrival {
    Link,
    History,
}

pub struct Site {
    visitor: Visitor,
    home_glass: crate::overlay::Probe,
    drawers: Drawers,
    greeting: Option<Subscription>,
    plate: Option<Entity<Plate>>,
    route: Route,
    pushed: bool,
    redirect_hops: u8,
    page: Entity<Page>,
    index: Remote<Index>,
    nav: Navigate,
    pub home: Home,
    page_titles: Option<Vec<Title>>,
    reveal: Reveal,
    payloads: Payloads,
    find: Find,
    focus: gpui::FocusHandle,
    _fetch: Option<Task<()>>,
    timeline: Timeline,
    _listening: Vec<Task<()>>,
}

const MAX_REDIRECTS: u8 = 5;

impl Site {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let visitor = seed::visitor();
        seed::remember(visitor.seen_intro);
        let home = Home::restore();
        let greet = !home.plain && !crate::browser::reduced_motion() && !visitor.seen_intro;

        crate::browser::register_web_mcp();

        let weak = cx.weak_entity();
        let nav: Navigate = Rc::new(move |href: String, window: &mut Window, cx: &mut App| {
            if route::is_internal(&href) {
                let path = route::to_path(&href);
                let weak = weak.clone();
                window.defer(cx, move |_, cx| {
                    let _ = weak.update(cx, |site, cx| site.go(&path, Arrival::Link, cx));
                });
            } else {
                route::open_external(&href);
            }
        });

        let (tx, history) = futures::channel::mpsc::unbounded::<String>();
        route::on_popstate(move |path| {
            let _ = tx.unbounded_send(path);
        });
        let (tx, reconnected) = futures::channel::mpsc::unbounded::<()>();
        route::on_reconnect(move || {
            let _ = tx.unbounded_send(());
        });
        let (find, replies) = Find::start();
        let redraw_page = |site: &mut Site, _: (), _: &mut Window, cx: &mut Context<Site>| {
            site.page.update(cx, |_, cx| cx.notify())
        };
        let listening = vec![
            pump(window, cx, history, |site, path, _, cx| {
                site.go(&path, Arrival::History, cx)
            }),
            pump(window, cx, reconnected, |site, (), _, cx| {
                site.reconnected(cx)
            }),
            pump(window, cx, replies, |site, reply, _, cx| {
                site.on_search_reply(reply, cx)
            }),
            pump(
                window,
                cx,
                crate::dom_input::subscribe(),
                |site, event, window, cx| site.on_find(event, window, cx),
            ),
            pump(
                window,
                cx,
                crate::content::diagram::subscribe(),
                redraw_page,
            ),
            pump(window, cx, crate::dom_embed::subscribe(), redraw_page),
            pump(window, cx, crate::dom_video::subscribe(), redraw_page),
        ];

        let mut site = Self {
            visitor,
            home_glass: Default::default(),
            drawers: Default::default(),
            greeting: None,
            plate: None,
            route: Route::parse(&route::current()),
            pushed: false,
            redirect_hops: 0,
            page: {
                let nav = nav.clone();
                cx.new(|cx| Page::new(nav, cx))
            },
            index: Remote::Loading(Task::ready(())),
            home,
            payloads: Default::default(),
            find,
            focus: cx.focus_handle(),
            page_titles: None,
            reveal: Reveal::default(),
            nav,
            _fetch: None,
            timeline: Default::default(),
            _listening: listening,
        };
        if site.route != Route::Home {
            let path = site.route.path().to_string();
            site.fetch(path, cx);
        }
        if greet {
            let plate = site.ensure_plate(cx);
            plate.update(cx, |plate, _| plate.greet());
            site.greeting =
                Some(cx.subscribe(&plate, |site, _, greeted, cx| site.on_greeted(greeted, cx)));
        }
        crate::mark("site new");
        site.fetch_index(cx);
        site.fetch_timeline(cx);
        site
    }

    pub fn go(&mut self, path: &str, by: Arrival, cx: &mut Context<Self>) {
        let push = by == Arrival::Link;
        self.open_panel(None, cx);
        let route = Route::parse(path);
        if route == self.route {
            self.retry_failed_page(cx);
            return;
        }
        if push {
            match path.split_once('#') {
                Some((_, frag)) if !frag.is_empty() => {
                    route::push(&format!("{}#{frag}", route.path()))
                }
                _ => route::push(route.path()),
            }
        }
        self.pushed = push;
        self.redirect_hops = 0;
        route::sync_document(route.path());
        self.route = route;
        self.page_titles = None;
        self.reveal.reset();
        if let Some(plate) = self.plate.as_ref() {
            plate.update(cx, |plate, _| plate.unsettle());
        }
        if self.route == Route::Home {
            self.retitle(cx);
        } else {
            self.page.update(cx, |page, cx| page.loading(cx));
        }
        self.fetch(self.route.path().to_string(), cx);
        cx.notify();
    }

    fn fetch(&mut self, path: String, cx: &mut Context<Self>) {
        let path = match path.split_once('#') {
            Some((p, _)) => p.to_string(),
            None => path,
        };
        if Route::parse(&path) == Route::Home {
            self._fetch = None;
            self.apply(RoutePayload::Home, cx);
            return;
        }
        if let Some(payload) = self.payloads.get(&path) {
            self._fetch = None;
            self.apply(payload, cx);
            return;
        }
        let url = http::route_url(&path);
        self._fetch = Some(Self::get::<RoutePayload>(
            url,
            Retry::BRIEF,
            cx,
            move |site, result, cx| {
                match result {
                    Ok(payload) => {
                        site.payloads.remember(path, payload.clone());
                        site.apply(payload, cx);
                    }
                    Err(e) => {
                        crate::console::warn(&format!("page {path}: {e:#}"));
                        site.page.update(cx, |page, cx| page.set(Load::Failed, cx))
                    }
                }
                cx.notify();
            },
        ));
    }

    fn get<T: serde::de::DeserializeOwned + 'static>(
        url: String,
        retry: Retry,
        cx: &mut Context<Self>,
        then: impl FnOnce(&mut Self, anyhow::Result<T>, &mut Context<Self>) + 'static,
    ) -> Task<()> {
        let fetch = http::get_json::<T>(
            cx.http_client(),
            url,
            retry,
            cx.background_executor().clone(),
        );
        cx.spawn(async move |this, cx| {
            let result = fetch.await;
            let _ = this.update(cx, |site, cx| then(site, result, cx));
        })
    }

    fn apply(&mut self, payload: RoutePayload, cx: &mut Context<Self>) {
        match payload {
            RoutePayload::Redirect { to, .. } => {
                if !route::is_internal(&to) {
                    route::open_external(&to);
                    self.page.update(cx, |page, cx| page.keep(cx));
                    if std::mem::take(&mut self.pushed) {
                        route::back();
                    } else {
                        route::replace("/");
                        route::sync_document("/");
                        self.route = Route::Home;
                        self.retitle(cx);
                    }
                    cx.notify();
                    return;
                }
                self.redirect_hops += 1;
                if self.redirect_hops > MAX_REDIRECTS {
                    crate::console::warn(&format!("page: too many redirects, last to {to}"));
                    self.page.update(cx, |page, cx| page.set(Load::Failed, cx));
                    cx.notify();
                    return;
                }
                let to = route::to_path(&to);
                route::replace(&to);
                route::sync_document(&to);
                self.route = Route::parse(&to);
                self.fetch(to, cx);
            }
            RoutePayload::Home => route::set_title("iammatthias.com"),
            payload => {
                route::set_title(&title_for(&payload));
                self.page_titles = Some(Title::for_page(&payload));
                self.retitle(cx);
                self.page
                    .update(cx, |page, cx| page.set(Load::Ready(payload), cx));
            }
        }
        cx.notify();
    }

    fn prefetch(&mut self, path: String, cx: &mut Context<Self>) {
        if !self.payloads.should_prefetch(&path) {
            return;
        }
        let key = path.clone();
        let task = Self::get::<RoutePayload>(
            http::route_url(&path),
            Retry::ONCE,
            cx,
            move |site, result, _| site.payloads.prefetched(key, result.ok()),
        );
        self.payloads.prefetching(path, task);
    }

    pub fn set_plain(&mut self, plain: bool, cx: &mut Context<Self>) {
        self.home.plain = plain;
        prefs::set("engraving", if plain { "off" } else { "on" });
        if let Some(plate) = self.plate.as_ref().filter(|_| plain) {
            plate.update(cx, |plate, cx| plate.end_greeting(cx));
        }
        cx.notify();
    }

    pub fn plate_zoom(&mut self, factor: f32, cx: &mut Context<Self>) {
        if let Some(plate) = self.plate.as_ref() {
            plate.update(cx, |plate, _| {
                if factor == 0.0 {
                    plate.reset_view()
                } else {
                    plate.zoom_by(factor)
                }
            });
        }
        cx.notify();
    }

    pub fn new_plate(&mut self, cx: &mut Context<Self>) {
        let seed = seed::hash(&format!(
            "{:08x}|{}|{}",
            self.visitor.seed,
            web_time::SystemTime::now()
                .duration_since(web_time::SystemTime::UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0),
            self.visitor.seed.rotate_left(7)
        ));
        self.visitor.seed = seed;
        seed::remember(true);
        if let Some(plate) = self.plate.as_ref() {
            plate.update(cx, |plate, _| plate.reseed(seed));
        }
        cx.notify();
    }

    pub fn set_motion(&mut self, on: bool, cx: &mut Context<Self>) {
        prefs::set("motion", if on { "on" } else { "off" });
        if let Some(plate) = self.plate.as_ref() {
            plate.update(cx, |plate, _| plate.set_motion(on));
        }
        cx.notify();
    }

    fn site_key(&mut self, e: &gpui::KeyDownEvent, _: &mut Window, cx: &mut Context<Self>) {
        match e.keystroke.key.as_str() {
            "/" => {
                self.open_panel(Some(Drawer::Find), cx);
                cx.stop_propagation();
            }
            "escape" if self.home.open.is_some() => self.open_panel(None, cx),
            "escape" if self.route != Route::Home => self.go("/", Arrival::Link, cx),
            _ => {}
        }
    }

    fn on_greeted(&mut self, greeted: &Greeted, cx: &mut Context<Self>) {
        match greeted {
            Greeted::Resting => self.retitle(cx),
            Greeted::Done => {
                self.greeting = None;
                seed::remember(true);
                cx.notify();
            }
        }
    }

    fn ensure_plate(&mut self, cx: &mut Context<Self>) -> Entity<Plate> {
        if self.plate.is_none() {
            let (titles, anchored) = self
                .lettering()
                .into_titles(self.route == Route::Home)
                .unwrap_or_default();
            let (seed, nav) = (self.visitor.seed, self.nav.clone());
            self.plate = Some(cx.new(|_| {
                let mut plate = Plate::new(seed, titles, nav);
                plate.set_anchored(anchored);
                plate
            }));
        }
        self.plate.clone().expect("just made")
    }

    fn plate_state(&self, cx: &App) -> Option<PlateState> {
        self.plate.as_ref().map(|p| {
            let p = p.read(cx);
            PlateState {
                zoom: p.zoom_percent(),
                seed: p.seed(),
                motion: p.motion(),
            }
        })
    }

    fn drawer_cards(
        &self,
        on_home: bool,
        theme: &Theme,
        window: &Window,
        cx: &mut Context<Self>,
    ) -> Vec<gpui::AnyElement> {
        crate::dom_input::begin_render();
        let plate = self.plate_state(cx);
        let inputs = drawers::PanelInputs {
            home: &self.home,
            on_home,
            over_column: design::controls_cover_column(window),
            plate: plate.as_ref(),
            semantic: self.find.hits_for(&self.home.query),
            index: self.index.ready(),
            nav: &self.nav,
            theme,
        };
        let crowded = self.drawers.crowded(window);
        let mut out = Vec::new();
        for which in Drawer::ALL {
            let glass = self.drawers.glass(which);
            if crowded.is_some_and(|c| c != which) {
                glass.clear();
                continue;
            }
            let anim = self.drawers.anim(which, window);
            out.push(drawers::drawer(which, &inputs, glass, &anim, cx));
        }
        out
    }

    pub fn pick_section(&mut self, section: Option<String>, cx: &mut Context<Self>) {
        self.home.section = section;
        self.retitle(cx);
        cx.notify();
    }

    fn fetch_timeline(&mut self, cx: &mut Context<Self>) {
        let Some(pages) = self.timeline.pages_to_fetch() else {
            return;
        };
        let (origin, client) = (route::origin(), cx.http_client());
        crate::mark(&format!("timeline fetch {pages:?}"));
        let timer = cx.background_executor().clone();
        let gets: Vec<_> = pages
            .map(|page| {
                http::get_json::<crate::api::Timeline>(
                    client.clone(),
                    format!("{origin}/api/app/timeline?page={page}"),
                    Retry::ONCE,
                    timer.clone(),
                )
            })
            .collect();
        self.timeline.task = Some(cx.spawn(async move |this, cx| {
            let got = futures::future::join_all(gets).await;
            let _ = this.update(cx, |site, cx| site.timeline_arrived(got, cx));
        }));
    }

    fn timeline_arrived(
        &mut self,
        got: Vec<anyhow::Result<crate::api::Timeline>>,
        cx: &mut Context<Self>,
    ) {
        self.timeline.task = None;
        let arrived = self.timeline.arrived(got);
        if let Some(wait) = arrived.retry {
            crate::console::warn(&format!(
                "timeline: a page failed; trying again in {wait:?}"
            ));
            self.timeline.task = Some(cx.spawn(async move |this, cx| {
                cx.background_executor().timer(wait).await;
                let _ = this.update(cx, |site, cx| {
                    site.timeline.task = None;
                    if site.timeline.items.is_empty() {
                        site.fetch_timeline(cx);
                    }
                });
            }));
        }
        crate::mark(&format!(
            "timeline arrived, have {}",
            self.timeline.items.len()
        ));
        if !arrived.any {
            if self.timeline.items.is_empty() {
                self.retitle(cx);
                cx.notify();
            }
            return;
        }
        let need = self
            .plate
            .as_ref()
            .filter(|_| self.route == Route::Home)
            .and_then(|p| {
                let labels = self
                    .timeline
                    .items
                    .iter()
                    .map(|t| t.title.as_str())
                    .chain(std::iter::repeat("an average title of this site"));
                p.read(cx).titles_to_fill(labels)
            });
        crate::mark(&format!("need {need:?}"));
        match need {
            Some(n)
                if !arrived.failed && n > self.timeline.items.len() && self.timeline.has_more() =>
            {
                self.timeline.want(n);
                self.fetch_timeline(cx);
            }
            _ => {
                self.retitle(cx);
                cx.notify();
            }
        }
    }

    fn lettering(&self) -> Lettering {
        lettering::lettering(&lettering::Sources {
            route: &self.route,
            page: self.page_titles.as_deref(),
            home: &self.home,
            timeline: &self.timeline.items,
            timeline_waiting: self.timeline.waiting(),
            index: self.index.ready(),
        })
    }

    fn retitle(&mut self, cx: &mut Context<Self>) {
        let Some(plate) = self.plate.as_ref() else {
            return;
        };
        if plate.read(cx).writing_greeting() {
            return;
        }
        let Some((titles, anchored)) = self.lettering().into_titles(self.route == Route::Home)
        else {
            return;
        };
        plate.update(cx, |plate, _| {
            plate.set_anchored(anchored);
            plate.set_titles(titles);
        });
    }

    fn reconnected(&mut self, cx: &mut Context<Self>) {
        self.retry_failed_page(cx);
        if matches!(self.index, Remote::GaveUp) {
            self.fetch_index(cx);
        }
    }

    fn retry_failed_page(&mut self, cx: &mut Context<Self>) {
        if matches!(self.page.read(cx).load, Load::Failed) {
            self.page.update(cx, |page, cx| page.loading(cx));
            self.fetch(self.route.path().to_string(), cx);
        }
    }

    fn fetch_index(&mut self, cx: &mut Context<Self>) {
        let url = format!("{}/api/app/index", route::origin());
        self.index = Remote::Loading(Self::get::<Index>(
            url,
            Retry::PATIENT,
            cx,
            |site, result, cx| match result {
                Ok(mut index) => {
                    index.prepare_search();
                    site.index = Remote::Ready(index);
                    site.retitle(cx);
                    cx.notify();
                }
                Err(e) => {
                    crate::console::warn(&format!("index: {e:#}"));
                    site.index = Remote::GaveUp;
                }
            },
        ));
    }
}

impl Render for Site {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = Theme::of(window, cx);
        if window.focused(cx).is_none() {
            window.focus(&self.focus, cx);
        }
        let covered = self.home.open.is_some() || self.drawers.any_shown();
        self.page
            .update(cx, |page, cx| page.set_covered(covered, cx));
        if self.greeting.is_some() {
            return div()
                .size_full()
                .relative()
                .font_family(crate::theme::BODY)
                .children(
                    self.plate
                        .clone()
                        .map(|p| div().absolute().inset_0().child(p)),
                )
                .child(div().absolute().inset_0().occlude())
                .into_any_element();
        }

        let drawers_moving = self.drawers.step(self.home.open, window);
        let (view, revealing) = if self.home.plain {
            self.render_plain(&theme, window, cx)
        } else {
            if let Some(plate) = self.plate.as_ref() {
                let glass: Vec<_> = std::iter::once(&self.home_glass)
                    .chain(self.drawers.panes())
                    .cloned()
                    .collect();
                plate.update(cx, |plate, _| plate.set_panes(&glass));
            }
            let plate_moving = self.plate.as_ref().is_none_or(|p| p.read(cx).animating());
            let (view, revealing) = if self.route == Route::Home {
                (self.render_home(&theme, window, cx), false)
            } else {
                self.render_page(&theme, window, cx)
            };
            (view, plate_moving || revealing)
        };
        if drawers_moving || revealing {
            window.request_animation_frame();
        }
        view
    }
}

impl Site {
    fn root(&self, theme: &Theme, cx: &mut Context<Self>) -> gpui::Stateful<gpui::Div> {
        crate::theme::with_fallbacks(div())
            .id("site")
            .track_focus(&self.focus)
            .size_full()
            .relative()
            .font_family(crate::theme::BODY)
            .bg(theme.paper)
            .on_key_down(cx.listener(Self::site_key))
    }

    fn render_home(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> gpui::AnyElement {
        let plate = &self.ensure_plate(cx);
        let wanted = plate.read(cx).titles_wanted();
        if wanted > 0 {
            self.timeline
                .want(wanted.max(self.timeline.items.len() + 1));
            self.fetch_timeline(cx);
        }
        plate.update(cx, |plate, _| {
            plate.set_frame(None);
            plate.set_waiting(false);
        });
        let plate = plate.clone();
        if let Some(href) = plate.read(cx).hovered_href() {
            if route::is_internal(&href) {
                self.prefetch(route::to_path(&href), cx);
            }
        }
        let progress = plate.read(cx).frame_progress();
        let plate = plate.clone();
        let leaving = Reveal::leaving(progress).map(|shown| {
            self.page.update(cx, |page, cx| page.set_shown(shown, cx));
            div().absolute().inset_0().child(
                self.page
                    .clone()
                    .cached(StyleRefinement::default().size_full()),
            )
        });
        if leaving.is_none() {
            self.page.update(cx, |page, cx| page.hidden(cx));
        }
        let panel = self.drawer_cards(true, theme, window, cx);
        self.root(theme, cx)
            .child(plate)
            .children(leaving)
            .child({
                let k = self.chrome_k(cx);
                let home = self.home_button(theme, window, cx);
                self.chrome(k, |d| d.children(home).children(panel))
            })
            .into_any_element()
    }

    fn render_page(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> (gpui::AnyElement, bool) {
        let plate = &self.ensure_plate(cx);
        let probe = self.page.read(cx).probe.clone();
        let page_ready = self.page.read(cx).ready();
        let framed = plate.read(cx).frame_progress() > 0.5;
        if page_ready || framed {
            plate.update(cx, |plate, _| plate.set_frame(Some(probe)));
        } else {
            plate.update(cx, |plate, _| plate.set_frame(None));
        }
        plate.update(cx, |plate, _| plate.set_waiting(!page_ready));
        let open = plate.read(cx).frame_open();
        let progress = plate.read(cx).frame_progress();

        let plate = plate.clone();
        self.page
            .update(cx, |page, cx| page.follow_appearance(theme.dark, cx));

        let step = self.reveal.page(
            web_time::Instant::now(),
            reveal::Page {
                ready: page_ready,
                has_content: self.page.read(cx).has_content(),
                frame_open: open,
                frame_progress: progress,
            },
        );
        self.page
            .update(cx, |page, cx| page.set_shown(step.shown, cx));

        let view = self
            .root(theme, cx)
            .child(div().absolute().inset_0().child(plate))
            .child(
                div().absolute().inset_0().child(
                    self.page
                        .clone()
                        .cached(StyleRefinement::default().size_full()),
                ),
            )
            .children(self.home_button(theme, window, cx))
            .children(self.drawer_cards(false, theme, window, cx))
            .into_any_element();
        (view, step.wants_frame)
    }

    fn render_plain(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> (gpui::AnyElement, bool) {
        let mut root = self.root(theme, cx);
        let mut wants_frame = false;
        if self.route == Route::Home {
            self.page.update(cx, |page, cx| page.hidden(cx));
            if let Some(index) = self.index.ready() {
                root = root.child(home::list(index, &self.home, &self.nav, theme, window));
            }
        } else {
            let step = Reveal::plain(self.page.read(cx).ready());
            wants_frame = step.wants_frame;
            self.page.update(cx, |page, cx| {
                page.set_shown(step.shown, cx);
                page.follow_appearance(theme.dark, cx);
            });
            root = root.child(
                div().absolute().inset_0().child(
                    self.page
                        .clone()
                        .cached(StyleRefinement::default().size_full()),
                ),
            );
        }
        let view = root
            .children(self.home_button(theme, window, cx))
            .children(self.drawer_cards(self.route == Route::Home, theme, window, cx))
            .into_any_element();
        (view, wants_frame)
    }
}

impl Site {
    fn chrome_k(&self, cx: &App) -> f32 {
        self.plate
            .as_ref()
            .map(|p| p.read(cx).chrome())
            .unwrap_or(1.0)
    }

    fn chrome(&self, k: f32, fill: impl FnOnce(gpui::Div) -> gpui::Div) -> gpui::AnyElement {
        if k <= 0.001 {
            for g in std::iter::once(&self.home_glass).chain(self.drawers.panes()) {
                g.clear();
            }
            return div().into_any_element();
        }
        fill(div().absolute().inset_0().opacity(k)).into_any_element()
    }

    fn home_button(
        &self,
        theme: &Theme,
        window: &Window,
        cx: &mut Context<Self>,
    ) -> Option<gpui::AnyElement> {
        let t = *theme;
        if self.drawers.crowded(window).is_some() || self.route == Route::Home {
            self.home_glass.clear();
            return None;
        }
        let half = |id: &'static str, label: &'static str| {
            div()
                .id(id)
                .h_full()
                .px(gpui::px(16.))
                .flex()
                .items_center()
                .hover_style(move |s| s.text_color(t.accent))
                .child(label)
        };
        let home = half("pill-home", "home")
            .on_click(cx.listener(|site, _, _, cx| site.go("/", Arrival::Link, cx)));
        let face = if self.home.plain {
            drawers::PillFace::Solid
        } else if design::controls_cover_column(window) {
            drawers::PillFace::GlassOverText
        } else {
            drawers::PillFace::Glass
        };
        let mut pill = drawers::pill(&t, face)
            .id("home-pill")
            .relative()
            .px(gpui::px(2.))
            .child(self.home_glass.element(crate::overlay::Redraw::Refresh))
            .child(home);
        if route::depth() > 0 {
            let back = half("pill-back", "back").on_click(cx.listener(|_, _, _, _| route::back()));
            let rule = div()
                .w(gpui::px(1.))
                .h(gpui::px(design::CONTROL_H * 0.45))
                .bg(t.edge());
            pill = pill.child(rule).child(back);
        }
        Some(
            div()
                .id("home-button")
                .occlude()
                .absolute()
                .top(gpui::px(design::INSET + crate::browser::safe_insets()[0]))
                .left(gpui::px(design::INSET))
                .child(pill)
                .into_any_element(),
        )
    }
}

fn title_for(payload: &RoutePayload) -> String {
    let Some(name) = payload.name() else {
        return "iammatthias.com".into();
    };
    match payload {
        RoutePayload::Tag { .. } => format!("#{name} · iammatthias.com"),
        RoutePayload::Developers(d) if !d.title.is_empty() => {
            format!("{} · iammatthias.com", d.title)
        }
        _ => format!("{name} · iammatthias.com"),
    }
}

#[cfg(test)]
mod tests {
    use super::{RoutePayload, Title, title_for};

    #[test]
    fn names_each_kind_of_page() {
        use crate::content::fixtures::{NAMES, payload};
        let mut pages: Vec<(String, RoutePayload)> = NAMES
            .iter()
            .map(|n| (n.to_string(), payload(n).unwrap()))
            .collect();
        pages.push(("now".into(), RoutePayload::Now(Box::default())));
        pages.push((
            "resume".into(),
            RoutePayload::Resume {
                title: "Résumé".into(),
                sections: vec![],
            },
        ));
        let developers = crate::api::Developers {
            title: "iammatthias.com developer documentation".into(),
            ..Default::default()
        };
        pages.push((
            "developers".into(),
            RoutePayload::Developers(Box::new(developers)),
        ));
        pages.push(("home".into(), RoutePayload::Home));
        pages.push((
            "redirect".into(),
            RoutePayload::Redirect { to: "/x".into() },
        ));
        let got: Vec<String> = pages
            .iter()
            .map(|(n, p)| {
                let frame = Title::for_page(p);
                format!(
                    "{n} | {} | {} {}",
                    title_for(p),
                    frame[0].label,
                    frame[0].href.as_deref().unwrap_or("-")
                )
            })
            .collect();
        let want = [
            "constructs | A Specimen of the Renderer · iammatthias.com | Posts /posts",
            "recipe | Neopolitan Pizza Dough · iammatthias.com | Recipes /recipes",
            "peppercorn | Brandy Peppercorn Sauce (two ways) · iammatthias.com | Recipes /recipes",
            "phosphene | Phosphene · iammatthias.com | Art /art",
            "essay | Own The Means of Cognition · iammatthias.com | Posts /posts",
            "series | Series, Two Ways · iammatthias.com | Art /art",
            "list | Recipes · iammatthias.com | Recipes /recipes",
            "content | Content · iammatthias.com | Content /content",
            "tag | #photography · iammatthias.com | photography /tags/photography",
            "tags | Tags · iammatthias.com | Tags /tags",
            "feed | Feed · iammatthias.com | Feed /feed",
            "post | Feed · iammatthias.com | Feed /feed",
            "page | Now · iammatthias.com | Now /now",
            "notfound | Not found · iammatthias.com | Not found -",
            "now | Now · iammatthias.com | Now /now",
            "resume | Resume · iammatthias.com | Resume /resume",
            "developers | iammatthias.com developer documentation · iammatthias.com | Developers /developers",
            "home | iammatthias.com | iammatthias.com /",
            "redirect | iammatthias.com | iammatthias.com /",
        ];
        assert_eq!(got, want);
    }
}
