//! The root view: the plate (greeting a first visit), then the site at whatever URL we were opened on.

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
pub mod signal;
mod timeline;

use crate::http::{self, Retry};
use find::Find;
pub use find::MAX_QUERY;
use lettering::Lettering;
use payloads::Payloads;
use signal::pump;
use timeline::Timeline;

/// How the reader came to a path.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Arrival {
    /// A link, a key or the home pill: a new history entry.
    Link,
    /// Back or forward: the browser has already moved through history.
    History,
}

pub struct Site {
    visitor: Visitor,
    /// the home button, drawn by the plate as a pane of glass (the panels hold their own)
    home_glass: crate::overlay::Probe,
    drawers: Drawers,
    /// the greeting, and the watch on its frames that hands it over to the plate
    /// a first visit is being greeted on the plate
    greeting: Option<Subscription>,
    /// the greeting is resting: the plate may be lettered now without stuttering it
    greeting_rested: bool,
    plate: Option<Entity<Plate>>,
    route: Route,
    /// `go` pushed a history entry for this route (there is one to go back from)
    pushed: bool,
    /// redirects followed since `go`
    redirect_hops: u8,
    page: Entity<Page>,
    index: Option<Index>,
    nav: Navigate,
    pub home: Home,
    /// the current page's own lettering for the frame
    page_titles: Option<Vec<Title>>,
    /// when the page's text began to appear: only once it has loaded and the frame has opened round it
    content_since: Option<web_time::Instant>,
    ready_since: Option<web_time::Instant>,
    payloads: Payloads,
    find: Find,
    /// the site's own focus: keys reach `site_key` only along gpui's focus path, so the root holds
    /// it whenever nothing inside does (Find's input is the browser's, outside gpui)
    focus: gpui::FocusHandle,
    _fetch: Option<Task<()>>,
    _index: Option<Task<()>>,
    /// the index fetch spent its tries: the next reconnect asks again
    index_gave_up: bool,
    timeline: Timeline,
    _listening: Vec<Task<()>>,
}

/// Redirects followed for one visit to a path before the page gives up.
const MAX_REDIRECTS: u8 = 5;

impl Site {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let visitor = seed::visitor();
        seed::remember(visitor.seen_intro);
        let home = Home::restore();
        // plain paper has no shader at all, so no greeting either; reduced motion skips it too
        let greet = !home.plain && !route::reduced_motion() && !visitor.seen_intro;

        route::register_web_mcp();

        let weak = cx.weak_entity();
        // navigation always runs after the current event: a link may be clicked from inside
        // another view's update (the plate's, the page's), and going somewhere updates them too
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

        // back/forward arrive outside GPUI, like the search worker's replies
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
            // "Find a title" is a native input over the canvas: what it reports, the site applies
            pump(
                window,
                cx,
                crate::dom_input::subscribe(),
                |site, event, window, cx| site.on_find(event, window, cx),
            ),
            // a diagram drawn in the browser: the page shows it
            pump(
                window,
                cx,
                crate::content::diagram::subscribe(),
                redraw_page,
            ),
            // a web component in the page changed height: the column makes room
            pump(window, cx, crate::dom_embed::subscribe(), redraw_page),
            // a clip read its own size: its figure takes that shape
            pump(window, cx, crate::dom_video::subscribe(), redraw_page),
        ];

        let mut site = Self {
            visitor,
            home_glass: Default::default(),
            drawers: Default::default(),
            greeting: None,
            greeting_rested: false,
            plate: None,
            route: Route::parse(&route::current()),
            pushed: false,
            redirect_hops: 0,
            page: {
                let nav = nav.clone();
                cx.new(|cx| Page::new(nav, cx))
            },
            index: None,
            home,
            payloads: Default::default(),
            find,
            focus: cx.focus_handle(),
            page_titles: None,
            content_since: None,
            ready_since: None,
            nav,
            _fetch: None,
            _index: None,
            index_gave_up: false,
            timeline: Default::default(),
            _listening: listening,
        };
        // the home page is the plate and the index: it has no route payload to wait for
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

    /// Open a site path, recording it in history unless back/forward brought the reader here.
    pub fn go(&mut self, path: &str, by: Arrival, cx: &mut Context<Self>) {
        let push = by == Arrival::Link;
        // going somewhere puts the menu away
        self.home.open = None;
        let route = Route::parse(path);
        // the same page: a link to it, or back/forward between its #anchors, which the page and
        // the browser see to (resetting the scroll and frame would lose the reader's place)
        if route == self.route {
            // unless it didn't load: asking for it again is how the reader tries again
            self.retry_failed_page(cx);
            return;
        }
        if push {
            // the address keeps its #fragment, for what on the page it names
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
        self.content_since = None;
        self.ready_since = None;
        if let Some(plate) = self.plate.as_ref() {
            plate.update(cx, |plate, _| plate.unsettle());
        }
        if self.route == Route::Home {
            // keep the last page: it shrinks back into the spiral with the frame
            self.retitle(cx);
        } else {
            self.page.update(cx, |page, cx| page.loading(cx));
        }
        self.fetch(self.route.path().to_string(), cx);
        cx.notify();
    }

    fn fetch(&mut self, path: String, cx: &mut Context<Self>) {
        // a #fragment is the page's own business (a component may open what it names)
        let path = match path.split_once('#') {
            Some((p, _)) => p.to_string(),
            None => path,
        };
        // home is the plate: there's nothing to ask the Worker for
        if Route::parse(&path) == Route::Home {
            self._fetch = None;
            self.apply(RoutePayload::Home, cx);
            return;
        }
        // already here (a page seen before, or prefetched from a hover): no wait at all
        if let Some(payload) = self.payloads.get(&path) {
            self._fetch = None;
            self.apply(payload, cx);
            return;
        }
        let fetch = http::get_json::<RoutePayload>(
            cx.http_client(),
            http::route_url(&path),
            Retry::BRIEF,
            cx.background_executor().clone(),
        );
        self._fetch = Some(cx.spawn(async move |this, cx| {
            let result = fetch.await;
            let _ = this.update(cx, |site, cx| {
                match result {
                    Ok(payload) => {
                        site.payloads.remember(path, payload.clone());
                        site.apply(payload, cx);
                    }
                    Err(e) => {
                        // why is for the console; the page says it plainly
                        #[cfg(target_family = "wasm")]
                        web_sys::console::warn_1(&format!("page {path}: {e:#}").into());
                        site.page.update(cx, |page, cx| page.set(Load::Failed, cx))
                    }
                }
                cx.notify();
            });
        }));
    }

    fn apply(&mut self, payload: RoutePayload, cx: &mut Context<Self>) {
        match payload {
            RoutePayload::Redirect { to, .. } => {
                if !route::is_internal(&to) {
                    route::open_external(&to);
                    // it opened in a new tab: this one goes back to where it was
                    self.page.update(cx, |page, cx| page.keep(cx));
                    if std::mem::take(&mut self.pushed) {
                        route::back();
                    } else {
                        // opened on the redirect (or come back to it): nowhere behind it, so home
                        route::replace("/");
                        route::sync_document("/");
                        self.route = Route::Home;
                        self.retitle(cx);
                    }
                    cx.notify();
                    return;
                }
                // redirects that lead round in a circle (cached, they'd recurse without end)
                self.redirect_hops += 1;
                if self.redirect_hops > MAX_REDIRECTS {
                    #[cfg(target_family = "wasm")]
                    web_sys::console::warn_1(
                        &format!("page: too many redirects, last to {to}").into(),
                    );
                    self.page.update(cx, |page, cx| page.set(Load::Failed, cx));
                    cx.notify();
                    return;
                }
                let to = route::to_path(&to);
                route::replace(&to);
                // the document under the canvas follows to the new address
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

    /// Fetch a page ahead of the click (a title under the pointer on the spiral).
    fn prefetch(&mut self, path: String, cx: &mut Context<Self>) {
        if !self.payloads.should_prefetch(&path) {
            return;
        }
        let fetch = http::get_json::<RoutePayload>(
            cx.http_client(),
            http::route_url(&path),
            Retry::ONCE,
            cx.background_executor().clone(),
        );
        let key = path.clone();
        let task = cx.spawn(async move |this, cx| {
            let payload = fetch.await.ok();
            let _ = this.update(cx, |site, _| site.payloads.prefetched(key, payload));
        });
        self.payloads.prefetching(path, task);
    }

    // ---- the site panel's controls ----

    /// Plain paper everywhere (no shader), or the engraving back on.
    pub fn set_plain(&mut self, plain: bool, cx: &mut Context<Self>) {
        self.home.plain = plain;
        prefs::set("engraving", if plain { "off" } else { "on" });
        if plain && self.greeting.take().is_some() {
            if let Some(plate) = self.plate.as_ref() {
                plate.update(cx, |plate, _| plate.end_greeting());
            }
            seed::remember(true);
        }
        cx.notify();
    }

    /// Zoom the home plate about the middle; 0 resets the view.
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

    /// A fresh seed: a new plate for the rest of this visit.
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

    /// Keys anywhere on the site: "/" opens the find panel in "Find a title", Escape closes it.
    fn site_key(&mut self, e: &gpui::KeyDownEvent, _: &mut Window, cx: &mut Context<Self>) {
        match e.keystroke.key.as_str() {
            "/" => {
                self.home.open = Some(Drawer::Find);
                self.focus_search(cx);
                cx.stop_propagation();
            }
            "escape" if self.home.open.is_some() => {
                self.home.open = None;
                cx.notify();
            }
            "escape" if self.route != Route::Home => self.go("/", Arrival::Link, cx),
            _ => {}
        }
    }

    /// Where the greeting on the plate has got to.
    fn on_greeted(&mut self, greeted: &Greeted, cx: &mut Context<Self>) {
        match greeted {
            // the plate is lettered while the greeting rests, so that work goes unseen
            Greeted::Resting => {
                self.greeting_rested = true;
                self.retitle(cx);
            }
            Greeted::Done => {
                self.greeting = None;
                seed::remember(true);
                cx.notify();
            }
        }
    }

    /// The plate, lettered as `retitle` would, the first time it's needed.
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
            plate: plate.as_ref(),
            semantic: self.find.hits_for(&self.home.query),
            index: self.index.as_ref(),
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

    /// Narrow the plate and the list to one section, or show everything.
    pub fn pick_section(&mut self, section: Option<String>, cx: &mut Context<Self>) {
        self.home.section = section;
        self.retitle(cx);
        cx.notify();
    }

    /// Fetch the pages of the timeline the view needs, together; the spiral is re-lettered
    /// once, when they're all here.
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
            eprintln!("timeline: a page failed; trying again in {wait:?}");
            self.timeline.task = Some(cx.spawn(async move |this, cx| {
                cx.background_executor().timer(wait).await;
                let _ = this.update(cx, |site, cx| {
                    site.timeline.task = None;
                    // nothing at all yet: nobody else will ask again
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
                // no timeline to be had: the index letters the spiral instead
                self.retitle(cx);
                cx.notify();
            }
            return;
        }
        // letter once, with as much as the view needs: if what's here falls short and there's
        // more, fetch it first (each re-lettering costs a frame); only the home spiral letters
        // the timeline, so a page waits until it's needed
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
            index: self.index.as_ref(),
        })
    }

    /// Letter the plate anew from what's here now.
    fn retitle(&mut self, cx: &mut Context<Self>) {
        // lettering the plate is heavy: not while the greeting is still being written
        if self.greeting.is_some() && !self.greeting_rested {
            return;
        }
        let Some(plate) = self.plate.as_ref() else {
            return;
        };
        let Some((titles, anchored)) = self.lettering().into_titles(self.route == Route::Home)
        else {
            return;
        };
        plate.update(cx, |plate, _| {
            plate.set_anchored(anchored);
            plate.set_titles(titles);
        });
    }

    /// The network may be back: the page and the index try again if they gave up. (The timeline
    /// needn't: the index letters the spiral without it. Diagrams and embeds see to their own.)
    fn reconnected(&mut self, cx: &mut Context<Self>) {
        self.retry_failed_page(cx);
        if self.index.is_none() && self.index_gave_up {
            self.fetch_index(cx);
        }
    }

    /// Ask again for the page showing, if it didn't load.
    fn retry_failed_page(&mut self, cx: &mut Context<Self>) {
        if matches!(self.page.read(cx).load, Load::Failed) {
            self.page.update(cx, |page, cx| page.loading(cx));
            self.fetch(self.route.path().to_string(), cx);
        }
    }

    fn fetch_index(&mut self, cx: &mut Context<Self>) {
        let url = format!("{}/api/app/index", route::origin());
        // the spiral is lettered from the index: rather than leave the plate on its placeholder
        // for good, a failed fetch is tried again
        let fetch = http::get_json::<Index>(
            cx.http_client(),
            url,
            Retry::PATIENT,
            cx.background_executor().clone(),
        );
        self._index = Some(cx.spawn(async move |this, cx| match fetch.await {
            Ok(mut index) => {
                index.prepare_search();
                let _ = this.update(cx, |site, cx| {
                    site.index = Some(index);
                    site.retitle(cx);
                    cx.notify();
                });
            }
            Err(e) => {
                eprintln!("index: {e:#}");
                let _ = this.update(cx, |site, _| site.index_gave_up = true);
            }
        }));
        self.index_gave_up = false;
    }
}

impl Render for Site {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = Theme::of(window, cx);
        if window.focused(cx).is_none() {
            window.focus(&self.focus, cx);
        }
        // a panel open (or opening, or closing) over the page: web components there step aside
        let covered = self.home.open.is_some() || self.drawers.any_shown();
        if crate::overlay::set_panel(covered) {
            if covered {
                crate::dom_embed::hide_all();
            }
            self.page.update(cx, |_, cx| cx.notify());
        }
        if self.greeting.is_some() {
            // the greeting is all there is: the plate under it takes no input yet
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

        route::set_narrow(f32::from(window.viewport_size().width) < design::NARROW_CONTROLS_W);
        self.drawers.step(self.home.open, window);
        if self.home.plain {
            return self.render_plain(&theme, window, cx);
        }
        // the home and menu controls float on the plate as glass
        if let Some(plate) = self.plate.as_ref() {
            let glass: Vec<_> = std::iter::once(&self.home_glass)
                .chain(self.drawers.panes())
                .cloned()
                .collect();
            plate.update(cx, |plate, _| plate.set_panes(&glass));
        }

        // drive frames from the root (redraw tracking always reaches it) while anything moves;
        // a settled page asks for none, and redraws only on input, so reading costs nothing
        let fading = self
            .content_since
            .is_some_and(|s| s.elapsed().as_secs_f32() < CONTENT_FADE);
        let loading_page = self.route != Route::Home && !self.page.read(cx).ready();
        if self.plate.as_ref().is_none_or(|p| p.read(cx).animating()) || fading || loading_page {
            window.request_animation_frame();
        }

        if self.route == Route::Home {
            return self.render_home(&theme, window, cx);
        }
        self.render_page(&theme, window, cx)
    }
}

impl Site {
    /// The root every view but the greeting draws into.
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

    /// The home spiral, with the last page shrinking back into it.
    fn render_home(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> gpui::AnyElement {
        let plate = &self.ensure_plate(cx);
        // the lettering in view is running out: bring as many pages as it needs
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
        let leaving = (progress > 0.01).then(|| {
            // the text goes first, in the first stretch of the unwind, then the line winds home
            self.page.update(cx, |page, cx| {
                page.set_shown(((progress - 0.6) / 0.4).clamp(0.0, 1.0), cx)
            });
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

    /// A page, framed by the line.
    fn render_page(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> gpui::AnyElement {
        // the line winds out from the spiral to frame the reading column, and follows it as it scrolls
        let plate = &self.ensure_plate(cx);
        // the frame opens with the content, never ahead of it: until the page has arrived the plate
        // stays as it was (the spiral coming from home, the last frame coming from another page)
        let probe = self.page.read(cx).probe.clone();
        let page_ready = self.page.read(cx).ready();
        let framed = plate.read(cx).frame_progress() > 0.5;
        if page_ready || framed {
            plate.update(cx, |plate, _| plate.set_frame(Some(probe)));
        } else {
            plate.update(cx, |plate, _| plate.set_frame(None));
        }
        // while the page is on its way the line quickens: the tap was heard
        plate.update(cx, |plate, _| plate.set_waiting(!page_ready));
        let open = plate.read(cx).frame_open();
        let progress = plate.read(cx).frame_progress();

        let plate = plate.clone();
        self.page
            .update(cx, |page, cx| page.follow_appearance(theme.dark, cx));

        // the column is laid out once, at its own size (so the frame can measure it and nothing
        // is laid out again while the line winds out round it); the text waits for the line to
        // open round it, then fades up
        let ready = self.page.read(cx).ready();
        if !ready {
            self.content_since = None;
            self.ready_since = None;
        } else {
            let ready_since = *self.ready_since.get_or_insert_with(web_time::Instant::now);
            if ready_since.elapsed().as_secs_f32() < 1.7 {
                window.request_animation_frame();
            }
            // never hold a page back for long, even if the frame can't settle
            let waited = ready_since.elapsed().as_secs_f32() > 1.6;
            if (open || waited) && self.content_since.is_none() {
                self.content_since = Some(web_time::Instant::now());
            }
        }
        // between pages the last one stays up until the next replaces it in place (same column
        // width, so only the frame's top and bottom move)
        let keeping_last = !ready && self.page.read(cx).has_content() && progress > 0.5;
        let fade = self
            .content_since
            .map_or(0.0, |s| (s.elapsed().as_secs_f32() / CONTENT_FADE).min(1.0));
        let shown = if keeping_last {
            1.0
        } else if ready {
            fade
        } else {
            0.0
        };
        self.page.update(cx, |page, cx| page.set_shown(shown, cx));

        self.root(theme, cx)
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
            .into_any_element()
    }

    /// No shader: the index as a list, pages as plain paper columns.
    fn render_plain(
        &mut self,
        theme: &Theme,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> gpui::AnyElement {
        let mut root = self.root(theme, cx);
        if self.route == Route::Home {
            self.page.update(cx, |page, cx| page.hidden(cx));
            if let Some(index) = self.index.as_ref() {
                root = root.child(home::list(index, &self.home, &self.nav, theme, window));
            }
        } else {
            let ready = self.page.read(cx).ready();
            if !ready {
                window.request_animation_frame();
            }
            self.page.update(cx, |page, cx| {
                page.set_shown(if ready { 1.0 } else { 0.0 }, cx);
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
        root.children(self.home_button(theme, window, cx))
            .children(self.drawer_cards(self.route == Route::Home, theme, window, cx))
            .into_any_element()
    }
}

impl Site {
    /// The controls, faded in as the plate rises after the greeting (absent until they start).
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

    /// Top left: the way out of a page. Come through the site, it's one pill with two halves,
    /// home, then back (the browser's back: the view they left, spiral or list, is as they left
    /// it); arrived from elsewhere there is nothing to go back to, so it's home alone. On a
    /// phone an open panel spans the width, so it steps aside (and leaves no glass) until the
    /// panel closes.
    fn home_button(
        &self,
        theme: &Theme,
        window: &Window,
        cx: &mut Context<Self>,
    ) -> Option<gpui::AnyElement> {
        let t = *theme;
        // the home page has no way out to show (and its lettering already names the site)
        if self.drawers.crowded(window).is_some() || self.route == Route::Home {
            self.home_glass.clear();
            return None;
        }
        // each half a full-height target of its own, the pill's padding moved onto them
        let half = |id: &'static str, label: &'static str| {
            div()
                .id(id)
                .h_full()
                .px(gpui::px(16.))
                .flex()
                .items_center()
                .hover(move |s| s.text_color(t.accent))
                .child(label)
        };
        let home = half("pill-home", "home")
            .on_click(cx.listener(|site, _, _, cx| site.go("/", Arrival::Link, cx)));
        let face = if self.home.plain {
            drawers::PillFace::Solid
        } else if route::narrow() {
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
                .top(gpui::px(design::INSET + route::safe_insets()[0]))
                .left(gpui::px(design::INSET))
                .child(pill)
                .into_any_element(),
        )
    }
}

/// How long a page's text takes to fade up once the frame has opened round it, seconds.
const CONTENT_FADE: f32 = 0.3;

/// The document title: the page's name (a tag's with its `#`, the developer docs' in full).
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

    /// Each kind of page's document title, and the heading its frame is lettered with.
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
