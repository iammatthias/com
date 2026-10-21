//! The Burin plate: the site's index engraved as one spiralling line. A WGSL
//! pass into an offscreen target that GPUI paints as a surface; titles live in
//! a script atlas, and hover/click are hit-tested against the same geometry the
//! shader draws.

use std::f32::consts::{PI, TAU};

use gpui::prelude::*;
use gpui::{Context, Pixels, Point, Window, div, px};
use gpui_wgpu::WgpuRenderTarget;
use web_time::Instant;

use crate::api::Navigate;
use crate::overlay::Probe;
use crate::seed::Rng;
use crate::theme::{self, Theme};

mod atlas;
#[cfg(test)]
mod contract;
mod frame;
mod geom;
mod gpu;
mod input;
mod reveal;
mod title;

pub(crate) use atlas::mips;
use atlas::{FONT, TitleAtlas};
use frame::Frame;
use geom::SUBJECT;
use gpu::{Gpu, Uniforms};
use input::Touches;
use reveal::Reveal;
pub use title::{Mark, Title};

/// how large the titles are written on the plate, in css px (the em of the script)
const SCRIPT_EM: f32 = 20.0;
/// on a phone
const SCRIPT_EM_PHONE: f32 = 18.0;
/// the spiral's start above the portrait's centre, in units of the shorter screen side
pub const LIFT: f32 = 0.06;

/// the plate's resting controls (the artifact's defaults); the panel is gone, the seed varies the rest
struct Controls {
    em: f32,
    bias: f32,
    speed: f32,
    warp: f32,
    disp: f32,
    ab: f32,
    flare: f32,
    haze: f32,
}

const CONTROLS: Controls = Controls {
    em: 1.0,
    bias: -0.2,
    speed: 0.2,
    warp: 2.15,
    disp: 0.45,
    ab: 0.35,
    flare: 0.4,
    haze: 0.3,
};

/// most panes of glass the plate draws
const PANES: usize = 4;

/// Everything the seed decides, drawn in the artifact's order so a seed means the same plate.
#[derive(Clone, Copy)]
struct Deal {
    wph: [f32; 4],
    wfq: [f32; 4],
    mph: [f32; 3],
    t_off: f32,
    osc: [f32; 3],
    fl: [[f32; 4]; 3],
    ab_ph: [f32; 4],
    ab_freq: f32,
    ab_dir: [f32; 2],
}

impl Deal {
    fn new(seed: u32) -> Self {
        let mut r = Rng::new(seed);
        let wph = [
            r.next() * TAU,
            r.next() * TAU,
            r.next() * TAU,
            r.next() * TAU,
        ];
        let wfq = [
            0.78 + r.next() * 0.5,
            0.78 + r.next() * 0.5,
            r.pick(&[2.0, 3.0, 4.0]),
            r.pick(&[4.0, 5.0, 6.0, 7.0]),
        ];
        let mph = [r.next() * TAU, r.next() * TAU, 0.75 + r.next() * 0.55];
        let t_off = r.next();
        let osc = [r.next(), r.next(), r.next()];
        let mut fl = [[0.0; 4]; 3];
        for l in &mut fl {
            let radius = 0.18 + r.next() * 0.42;
            let dir = if r.next() < 0.5 { -1.0 } else { 1.0 };
            *l = [
                radius,
                dir * (0.04 + r.next() * 0.1),
                r.next() * TAU,
                r.next(),
            ];
        }
        let ab_ph = [
            r.next() * TAU,
            r.next() * TAU,
            r.next() * TAU,
            r.next() * TAU,
        ];
        let _ = r.next(); // the artifact draws a direction it then overwrites
        let ab_freq = 2.0 + (r.next() * 4.0).floor();
        let ab_dir = [r.next() * 2.0 - 1.0, 0.0];
        Self {
            wph,
            wfq,
            mph,
            t_off,
            osc,
            fl,
            ab_ph,
            ab_freq,
            ab_dir,
        }
    }

    fn warp(&self, qx: f32, qy: f32, qr: f32, a: f32, t: f32) -> f32 {
        (qx * 5.1 * self.wfq[0] + t * 0.4 + self.wph[0]).sin()
            * (qy * 4.3 * self.wfq[1] - t * 0.33 + self.wph[1]).sin()
            + 0.6 * (a * self.wfq[2] + qr * 9.0 - t * 0.27 + self.wph[2]).sin()
            + 0.35 * (a * self.wfq[3] - qr * 14.0 + t * 0.21 + self.wph[3]).sin()
    }
}

/// pan and zoom, in device px about the centre
#[derive(Clone, Copy)]
struct View {
    x: f32,
    y: f32,
    z: f32,
}

pub struct Plate {
    seed: u32,
    touches: std::rc::Rc<std::cell::RefCell<Touches>>,
    deal: Deal,
    titles: Vec<Title>,
    atlas: TitleAtlas,
    atlas_dirty: bool,
    gpu: Option<Gpu>,
    target: Option<WgpuRenderTarget>,
    nav: Navigate,
    // clocks: T drives drift and morph, C the slow breathing of each control
    t: f32,
    /// where each flare is along the line, in turns (NaN until the plate has a size)
    flares: [f32; 3],
    /// how far out each flare was found last frame (the next search starts there, so it keeps
    /// to the same stretch of line where the line folds back on itself)
    flare_r: std::cell::Cell<[f32; 3]>,
    c: f32,
    last: Instant,
    reveal: Reveal,
    /// titles start at the first lettered turn (see set_anchored)
    anchored: bool,
    view: View,
    pointer: Option<Point<Pixels>>,
    /// the pointer is over the plate itself, not a panel, page or control on top of it
    over: bool,
    drag: Option<(Point<Pixels>, f32)>,
    hover: Option<usize>,
    hold_until: Option<Instant>,
    motion: bool,
    // the breathing values of warp and disp, needed by the hit test too
    e_warp: f32,
    e_disp: f32,
    // last frame's geometry, for hit testing
    dpr: f32,
    w: f32,
    h: f32,
    dark: bool,
    frame: Frame,
    /// the controls floating on the plate
    panes: Vec<Probe>,
    waiting: bool,
    /// what the last rendered frame was drawn with, so an unchanged frame isn't drawn again
    last_drawn: Option<(Uniforms, gpui::Size<gpui::DevicePixels>)>,
    /// debug switches from the URL hash: `lite` drops the optics, `half` renders at half resolution
    lite: bool,
    half: bool,
    /// the first-visit greeting, written on the plate until it winds into the line's start
    greeting: Option<crate::intro::Greeting>,
    /// greeted (the optics are whole from the first frame), and told the site it's resting
    greeted: bool,
    rest_told: bool,
}

/// What the greeting tells the site.
pub enum Greeted {
    /// written and resting: heavy work now goes unnoticed
    Resting,
    /// wound into the point the line is drawing out of
    Done,
}

impl gpui::EventEmitter<Greeted> for Plate {}

impl Plate {
    pub fn new(seed: u32, titles: Vec<Title>, nav: Navigate) -> Self {
        let deal = Deal::new(seed);
        let atlas = TitleAtlas::build(&titles);
        let now = Instant::now();
        Self {
            seed,
            touches: Touches::listen(),
            deal,
            titles,
            atlas,
            atlas_dirty: true,
            gpu: None,
            target: None,
            nav,
            t: 0.0,
            flares: [f32::NAN; 3],
            flare_r: std::cell::Cell::new([f32::NAN; 3]),
            c: 0.0,
            last: now,
            reveal: Reveal::new(),
            anchored: false,
            view: View {
                x: crate::route::debug::number("px").unwrap_or(0.0),
                y: crate::route::debug::number("py").unwrap_or(0.0),
                z: crate::route::debug::number("z").map_or(1.0, |z| z.clamp(0.35, 14.0)),
            },
            pointer: None,
            over: false,
            drag: None,
            hover: None,
            hold_until: None,
            motion: !crate::route::reduced_motion()
                && crate::prefs::get("motion").as_deref() != Some("off"),
            e_warp: 0.0,
            e_disp: 0.0,
            dpr: 1.0,
            w: 1.0,
            h: 1.0,
            dark: false,
            frame: Frame::default(),
            panes: Vec::new(),
            waiting: false,
            last_drawn: None,
            lite: crate::route::debug::flag("lite"),
            half: crate::route::debug::flag("half"),
            greeting: None,
            greeted: false,
            rest_told: false,
        }
    }

    /// The script's weight on this plate: the seed's hand, a light pen around the font's raw
    /// strokes. Drawn apart from the artifact's deal so seeds keep meaning the same plate.
    fn pen_weight(&self) -> f32 {
        let h = self.seed.wrapping_mul(0x9E37_79B1).rotate_right(13);
        270.0 + (h % 6) as f32 * 16.0
    }

    pub fn seed(&self) -> u32 {
        self.seed
    }

    /// Deal a new plate from another seed: warp, morph, optics and flares all change.
    pub fn reseed(&mut self, seed: u32) {
        self.seed = seed;
        self.deal = Deal::new(seed);
        self.t = 0.0;
        self.c = 0.0;
    }

    /// The title under the pointer, if it links somewhere.
    pub fn hovered_href(&self) -> Option<String> {
        self.hover
            .and_then(|i| self.atlas.segs.get(i))
            .and_then(|s| s.title.href.clone())
    }

    /// A page is loading: the line quickens until it arrives.
    pub fn set_waiting(&mut self, waiting: bool) {
        self.waiting = waiting;
    }

    pub fn motion(&self) -> bool {
        self.motion
    }

    pub fn set_motion(&mut self, on: bool) {
        self.motion = on;
    }

    pub fn set_titles(&mut self, titles: Vec<Title>) {
        // links, colours and headings too: the same words in another section are another atlas
        if titles == self.titles {
            return;
        }
        self.atlas = TitleAtlas::build(&titles);
        self.titles = titles;
        self.atlas_dirty = true;
        self.hover = None;
    }

    /// The controls to draw as panes of glass (at most four): the plate refracts, frosts and
    /// lights the engraving under where each probe says its control was painted.
    pub fn set_panes(&mut self, panes: &[Probe]) {
        if panes.len() > PANES {
            crate::limits::reached("glass panes (4): the rest are drawn without glass");
        }
        self.panes = panes.iter().take(PANES).cloned().collect();
    }

    /// Pane rectangles in plate device px (y up): centre.xy, half-size.xy; zero where empty.
    fn pane_uniforms(&self) -> [[f32; 4]; PANES] {
        let mut out = [[0.0; 4]; PANES];
        let d = self.dpr;
        for (slot, pane) in out.iter_mut().zip(&self.panes) {
            if let Some(b) = pane.bounds() {
                let (x, y) = (f32::from(b.origin.x) * d, f32::from(b.origin.y) * d);
                let (w, h) = (f32::from(b.size.width) * d, f32::from(b.size.height) * d);
                *slot = [x + w / 2.0, self.h - (y + h / 2.0), w / 2.0, h / 2.0];
            }
        }
        out
    }

    /// Frame the reading column the probe measures, or `None` to wind back into the spiral.
    pub fn set_frame(&mut self, page: Option<Probe>) {
        self.frame.set(page);
    }

    /// A new page is on its way: don't call the frame open until it has re-measured.
    pub fn unsettle(&mut self) {
        self.frame.unsettle();
    }

    /// Whether the plate is moving and needs the next frame. A settled page frame doesn't:
    /// it is redrawn only when something changes (scrolling, resizing, theme).
    pub fn animating(&self) -> bool {
        let transitioning = self.frame.moving() || self.reveal.moving() || self.greeting.is_some();
        let home_motion =
            (!self.frame.has_page() && (self.motion || self.touching())) || self.waiting;
        transitioning || home_motion
    }

    /// How far the line has wound out round the page, eased 0..1.
    pub fn frame_progress(&self) -> f32 {
        self.frame.progress()
    }

    /// The line has finished winding out and sits exactly round the column: content may show.
    pub fn frame_open(&self) -> bool {
        self.frame.open()
    }

    /// the core the line winds around, plate device px (y up): centre.xy, half-size.xy
    fn core(&self) -> [f32; 4] {
        self.frame.core(self.dpr, self.w, self.h, self.lift())
    }

    /// Line spacing in css px, set from the size of the script: titles are written at
    /// SCRIPT_EM css px (SCRIPT_EM_PHONE on a phone), and the spacing follows from where the
    /// atlas puts the x-height (XH_BAND of a turn).
    fn spacing(&self) -> f32 {
        let css_w = self.w / self.dpr;
        let em = if css_w < crate::design::PLATE_SMALL_W {
            SCRIPT_EM_PHONE
        } else {
            SCRIPT_EM
        };
        em * self.atlas.font_ref / (FONT * CONTROLS.em)
    }

    /// How far above the middle the spiral starts, device px: out of the portrait's forehead
    /// on the home plate, back to the middle as the line frames a page.
    fn lift(&self) -> f32 {
        LIFT * self.w.min(self.h) * (1.0 - self.frame_progress())
    }

    /// Greet a first visit: the greeting is written on the plate, then winds into the point
    /// its line is drawn out of.
    pub fn greet(&mut self) {
        self.greeting = Some(crate::intro::Greeting::new());
        self.greeted = true;
        self.rest_told = false;
        self.reveal.emerge();
    }

    /// Stop greeting now (plain paper was chosen): the line draws out as if it had finished.
    pub fn end_greeting(&mut self) {
        if self.greeting.take().is_some() {
            self.reveal.start_pen();
        }
    }

    /// Tell the site where the greeting has got to, and hand over to the pen when it's done.
    fn follow_greeting(&mut self, cx: &mut Context<Self>) {
        let Some(greeting) = self.greeting.as_ref() else {
            return;
        };
        if !self.rest_told && greeting.resting() {
            self.rest_told = true;
            cx.emit(Greeted::Resting);
        }
        if greeting.done() {
            self.greeting = None;
            self.reveal.start_pen();
            cx.emit(Greeted::Done);
        }
    }

    /// How present the controls should be: they arrive with the plate as it rises after the
    /// greeting, and are simply there otherwise.
    pub fn chrome(&self) -> f32 {
        self.reveal.chrome()
    }

    /// Write the titles from their start at the first lettered turn (the timeline, newest at
    /// the centre), rather than from wherever the seed drops into them.
    pub fn set_anchored(&mut self, on: bool) {
        self.anchored = on;
    }

    /// Atlas px into the titles where the spiral's lettering begins.
    fn text_start(&self) -> f32 {
        if self.anchored {
            // the newest title is the first one seen from the centre: the text starts on the first
            // turn clear of the portrait (and of the six bare turns), so none of it is spent
            // under the face; before it (a negative place in the text) the line stays bare
            let d = self.spacing() * self.dpr;
            let sc = self.atlas.font_ref / (d * CONTROLS.em);
            let tc = self.face_clear_turn().max(6.0);
            -(PI * d * tc * tc) * sc
        } else {
            self.deal.t_off * self.atlas.text_len
        }
    }

    /// Where the timeline's lettering starts, in line spacings from the spiral's start: round the
    /// oval the shader keeps titles out of (plate.wgsl morph_at), midway between its reach to the
    /// side (where each turn begins) and its reach to the brow and chin, so the newest title sits
    /// close by the face and only a little of the text is left under its top and bottom.
    fn face_clear_turn(&self) -> f32 {
        let d = self.spacing() * self.dpr;
        let mn = self.w.min(self.h);
        let k = 1.12 + geom::FACE_CLEAR * d / (SUBJECT * 0.9 * mn);
        let side = k * SUBJECT * 0.82 * mn;
        let tall = k * SUBJECT * 1.02 * mn + self.lift();
        0.5 * (side + tall) / d
    }

    /// How many titles the lettering in view needs (with room to pan), judged by the titles
    /// it has: 0 when it has enough or isn't the timeline.
    pub fn titles_wanted(&self) -> usize {
        // the atlas holds no more: more titles would only be cut off again
        if !self.wants_more() || self.atlas.full {
            return 0;
        }
        let per = self.atlas.text_len / self.titles.len().max(1) as f32;
        ((self.reach() / per.max(1.0)) * 1.3).ceil() as usize
    }

    /// Atlas px of titles the lettering in view reaches.
    fn reach(&self) -> f32 {
        let d = self.spacing() * self.dpr;
        let sc = self.atlas.font_ref / (d * CONTROLS.em);
        let (cx, cy) = (
            self.w / 2.0 + self.view.x,
            self.h / 2.0 + self.lift() + self.view.y,
        );
        let r = [(0.0, 0.0), (self.w, 0.0), (0.0, self.h), (self.w, self.h)]
            .iter()
            .map(|&(x, y): &(f32, f32)| (x - cx).hypot(y - cy))
            .fold(0.0f32, f32::max)
            / self.view.z;
        let tc = r / d + 1.0;
        PI * d * tc * tc * sc + self.text_start()
    }

    /// How many of `labels` (in order) the lettering in view would reach, with room to pan or
    /// zoom out, judged from their lengths before any is set; None before the plate has a size.
    pub fn titles_to_fill<'a>(&self, labels: impl Iterator<Item = &'a str>) -> Option<usize> {
        if self.w <= 0.0 {
            return None;
        }
        let want = self.reach().max(0.0) * 1.3;
        let mut px = 0.0;
        let mut n = 0;
        for l in labels {
            if px > want {
                break;
            }
            // a script letter is a little under half an em; each title has an em of lead each side
            px += l.chars().count() as f32 * FONT * 0.45 + FONT * 1.3;
            n += 1;
        }
        Some(n)
    }

    /// The lettering visible now reaches near the end of the titles it has: more should come.
    fn wants_more(&self) -> bool {
        if !self.anchored || self.w <= 0.0 || self.frame.has_page() {
            return false;
        }
        self.reach() > self.atlas.text_len * 0.8
    }

    /// How far along the spiral the pen has drawn, device px of arc; None when there is no pen
    /// or it has drawn the whole line.
    fn pen_arc(&self) -> Option<f32> {
        let ease = self.reveal.pen()?;
        let d = self.spacing() * self.dpr;
        let r = ease * (0.5 * self.w.hypot(self.h) + self.lift() + 2.0 * d);
        Some(PI * r * r / d)
    }

    /// Advance the clocks: drift and breathing pause while a title is under the pointer.
    fn tick(&mut self) {
        // waiting blank for a pen with no greeting on it: hold still, so after one frame it costs
        // nothing (under a greeting the grain and glass keep moving)
        if self.reveal.waiting_for_pen() && self.greeting.is_none() {
            self.last = Instant::now();
            return;
        }
        self.apply_touches();
        let now = Instant::now();
        let dt = (now - self.last).as_secs_f32().min(0.1);
        self.last = now;
        self.frame.step(dt);
        if self.frame.has_page() {
            let k = 1.0 - (-dt * 6.0).exp();
            self.view = View {
                x: self.view.x * (1.0 - k),
                y: self.view.y * (1.0 - k),
                z: self.view.z + (1.0 - self.view.z) * k,
            };
        }
        let holding = self.hold_until.is_some_and(|until| now < until);
        if !holding && self.motion && !self.frame.round_page() {
            self.c += dt;
            let ease =
                |period: f32, phase: f32| 0.5 - 0.5 * ((self.c / period + phase) * TAU).cos();
            let speed = CONTROLS.speed * (0.35 + 0.65 * ease(41.0, self.deal.osc[0]));
            self.e_warp = CONTROLS.warp * (0.35 + 0.65 * ease(29.0, self.deal.osc[1]));
            self.e_disp = CONTROLS.disp * (0.35 + 0.65 * ease(53.0, self.deal.osc[2]));
            // waiting on a page: the drift runs several times faster, a visible "working"
            let quicken = if self.waiting { 6.0 } else { 1.0 };
            self.t += dt * speed * 0.9 * quicken;
            self.move_flares(dt);
        } else if !self.motion && self.e_warp == 0.0 {
            self.e_warp = CONTROLS.warp * 0.35;
            self.e_disp = CONTROLS.disp * 0.35;
        }
    }

    /// The first turn a light may ride: clear of the portrait (where the tone folds the line).
    fn first_flare_turn(&self) -> f32 {
        let mn = self.w.min(self.h);
        ((SUBJECT * 1.25 * mn + self.lift()) / (self.spacing() * self.dpr)).max(4.0)
            * (1.0 - self.frame_progress())
            + 4.0 * self.frame_progress()
    }

    /// The lights ride the line: each glides along it at a steady pace (some outward, some in),
    /// starting over from the other end once it leaves the screen.
    fn move_flares(&mut self, dt: f32) {
        if self.w <= 0.0 {
            return;
        }
        let d = self.spacing() * self.dpr;
        let core = self.core();
        let perimeter = 4.0 * (core[2] + core[3]);
        // the farthest turn on screen, and the first one clear of the face
        let reach = (self.w.hypot(self.h) * 0.5 / self.view.z
            + self.view.x.hypot(self.view.y) / self.view.z)
            / d
            + 2.0;
        let first = self.first_flare_turn();
        let mn = self.w.min(self.h);
        let mut found = self.flare_r.get();
        for i in 0..3 {
            let [radius, dir, phase, _] = self.deal.fl[i];
            if self.flares[i].is_nan() {
                self.flares[i] = (radius * mn / d).floor().max(first.ceil()) + phase / TAU;
            }
            let p = self.flares[i];
            // an unhurried pace along the line: ~8 css px a second, whatever the turn's length
            let along = TAU * d * (p + 0.5) + perimeter;
            let next = p + dir.signum() * dt * 8.0 * self.dpr / along.max(1.0);
            self.flares[i] = if next > reach {
                first.ceil() + next.rem_euclid(1.0)
            } else if next < first {
                reach.floor() + next.rem_euclid(1.0)
            } else {
                next
            };
            // a wrap starts the search afresh
            if (self.flares[i] - next).abs() > 0.5 {
                found[i] = f32::NAN;
            }
        }
        self.flare_r.set(found);
    }

    /// A light for the shader: where it is on the plate (device px from the spiral's start),
    /// its pulse's phase and its hue.
    fn flare_uniform(&self, i: usize) -> [f32; 4] {
        let [_, _, phase, hue] = self.deal.fl[i];
        let p = if self.flares[i].is_nan() {
            6.0 + phase / TAU
        } else {
            self.flares[i]
        };
        let mut found = self.flare_r.get();
        let ([x, y], r) = self.point_on_line(p, found[i]);
        found[i] = r;
        self.flare_r.set(found);
        [x, y, phase, hue]
    }
}

impl Render for Plate {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        if self.animating() {
            window.request_animation_frame();
        }
        let theme = Theme::of(window, cx);
        self.draw(window, &theme);
        self.follow_greeting(cx);

        let mut root = self.input(div().id("plate").size_full().relative(), cx);
        if let Some(target) = self.target.as_ref() {
            root = root.child(
                div()
                    .absolute()
                    .inset_0()
                    .child(target.surface().size_full()),
            );
        }
        if let (Some(i), Some(p)) = (self.hover, self.pointer) {
            root = root.child(
                div()
                    .absolute()
                    .left(p.x + px(14.))
                    .top(p.y - px(30.))
                    .px(px(7.))
                    .py(px(4.))
                    .rounded(px(2.))
                    .bg(theme.veil(0.9))
                    .font_family(theme::BODY)
                    .italic()
                    .text_size(px(15.))
                    .text_color(theme.accent)
                    .flex()
                    .gap(px(5.))
                    // the reading face has no arrows; the mono face does
                    .child(
                        div()
                            .font_family(theme::MONO)
                            .not_italic()
                            .text_size(px(12.))
                            .child("↗"),
                    )
                    .child(self.atlas.segs[i].title.label.clone()),
            );
        }
        root
    }
}
