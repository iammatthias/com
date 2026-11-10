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
mod greeting;
mod input;
mod reveal;
mod title;

pub(crate) use atlas::mips;
use atlas::{FONT, TitleAtlas};
use frame::Frame;
use geom::SUBJECT;
pub(crate) use gpu::upload as upload_texture;
use gpu::{Gpu, Uniforms};
pub use greeting::Greeted;
use greeting::{Greeting, Moment};
use input::Touches;
use reveal::Reveal;
pub use title::{Mark, Title};

const SCRIPT_EM: f32 = 20.0;
const SCRIPT_EM_PHONE: f32 = 18.0;
pub const LIFT: f32 = 0.06;

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

const PANES: usize = 4;

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
        let _ = r.next();
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
    t: f32,
    flares: [f32; 3],
    flare_r: std::cell::Cell<[f32; 3]>,
    c: f32,
    last: Instant,
    reveal: Reveal,
    anchored: bool,
    view: View,
    pointer: Option<Point<Pixels>>,
    over: bool,
    drag: Option<(Point<Pixels>, f32)>,
    hover: Option<usize>,
    hold_until: Option<Instant>,
    motion: bool,
    e_warp: f32,
    e_disp: f32,
    dpr: f32,
    w: f32,
    h: f32,
    dark: bool,
    frame: Frame,
    panes: Vec<Probe>,
    waiting: bool,
    last_drawn: Option<(Uniforms, gpui::Size<gpui::DevicePixels>)>,
    lite: bool,
    half: bool,
    greeting: Greeting<crate::intro::Greeting>,
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
                x: crate::browser::debug::number("px").unwrap_or(0.0),
                y: crate::browser::debug::number("py").unwrap_or(0.0),
                z: crate::browser::debug::number("z").map_or(1.0, |z| z.clamp(0.35, 14.0)),
            },
            pointer: None,
            over: false,
            drag: None,
            hover: None,
            hold_until: None,
            motion: !crate::browser::reduced_motion()
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
            lite: crate::browser::debug::flag("lite"),
            half: crate::browser::debug::flag("half"),
            greeting: Greeting::Never,
        }
    }

    fn pen_weight(&self) -> f32 {
        let h = self.seed.wrapping_mul(0x9E37_79B1).rotate_right(13);
        270.0 + (h % 6) as f32 * 16.0
    }

    pub fn seed(&self) -> u32 {
        self.seed
    }

    pub fn reseed(&mut self, seed: u32) {
        self.seed = seed;
        self.deal = Deal::new(seed);
        self.t = 0.0;
        self.c = 0.0;
    }

    pub fn hovered_href(&self) -> Option<String> {
        self.hover
            .and_then(|i| self.atlas.segs.get(i))
            .and_then(|s| s.title.href.clone())
    }

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
        if titles == self.titles {
            return;
        }
        self.atlas = TitleAtlas::build(&titles);
        self.titles = titles;
        self.atlas_dirty = true;
        self.hover = None;
    }

    pub fn set_panes(&mut self, panes: &[Probe]) {
        if panes.len() > PANES {
            crate::limits::reached("glass panes (4): the rest are drawn without glass");
        }
        self.panes = panes.iter().take(PANES).cloned().collect();
    }

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

    pub fn set_frame(&mut self, page: Option<Probe>) {
        self.frame.set(page);
    }

    pub fn unsettle(&mut self) {
        self.frame.unsettle();
    }

    pub fn animating(&self) -> bool {
        let transitioning =
            self.frame.moving() || self.reveal.moving() || self.greeting.active().is_some();
        let home_motion =
            (!self.frame.has_page() && (self.motion || self.touching())) || self.waiting;
        transitioning || home_motion
    }

    pub fn frame_progress(&self) -> f32 {
        self.frame.progress()
    }

    pub fn frame_open(&self) -> bool {
        self.frame.open()
    }

    fn core(&self) -> [f32; 4] {
        self.frame.core(self.dpr, self.w, self.h, self.lift())
    }

    fn spacing(&self) -> f32 {
        self.script_em() * self.atlas.font_ref / (FONT * CONTROLS.em)
    }

    fn script_em(&self) -> f32 {
        if self.w / self.dpr < crate::design::PLATE_SMALL_W {
            SCRIPT_EM_PHONE
        } else {
            SCRIPT_EM
        }
    }

    fn lift(&self) -> f32 {
        LIFT * self.w.min(self.h) * (1.0 - self.frame_progress())
    }

    pub fn greet(&mut self) {
        self.greeting.begin(crate::intro::Greeting::new());
        self.reveal.emerge();
    }

    pub fn writing_greeting(&self) -> bool {
        self.greeting.being_written()
    }

    pub fn end_greeting(&mut self, cx: &mut Context<Self>) {
        if let Some(told) = self.greeting.end() {
            self.reveal.start_pen();
            cx.emit(told);
        }
    }

    fn follow_greeting(&mut self, cx: &mut Context<Self>) {
        let Some(greeting) = self.greeting.active() else {
            return;
        };
        let moment = Moment {
            resting: greeting.resting(),
            done: greeting.done(),
        };
        if greeting.drawing_out() {
            self.reveal.start_pen();
        }
        for told in self.greeting.follow(moment).into_iter().flatten() {
            cx.emit(told);
        }
    }

    pub fn chrome(&self) -> f32 {
        self.reveal.chrome()
    }

    pub fn set_anchored(&mut self, on: bool) {
        self.anchored = on;
    }

    fn text_start(&self) -> f32 {
        if self.anchored {
            let d = self.spacing() * self.dpr;
            let sc = self.atlas.font_ref / (d * CONTROLS.em);
            let tc = self.face_clear_turn().max(6.0);
            -(PI * d * tc * tc) * sc
        } else {
            self.deal.t_off * self.atlas.text_len
        }
    }

    fn face_clear_turn(&self) -> f32 {
        let d = self.spacing() * self.dpr;
        let mn = self.w.min(self.h);
        let k = 1.12 + geom::FACE_CLEAR * d / (SUBJECT * 0.9 * mn);
        let side = k * SUBJECT * 0.82 * mn;
        let tall = k * SUBJECT * 1.02 * mn + self.lift();
        0.5 * (side + tall) / d
    }

    pub fn titles_wanted(&self) -> usize {
        if !self.wants_more() || self.atlas.full {
            return 0;
        }
        let per = self.atlas.text_len / self.titles.len().max(1) as f32;
        ((self.reach() / per.max(1.0)) * 1.3).ceil() as usize
    }

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
            px += l.chars().count() as f32 * FONT * 0.45 + FONT * 1.3;
            n += 1;
        }
        Some(n)
    }

    fn wants_more(&self) -> bool {
        if !self.anchored || self.w <= 0.0 || self.frame.has_page() {
            return false;
        }
        self.reach() > self.atlas.text_len * 0.8
    }

    fn pen_arc(&self) -> Option<f32> {
        let ease = self.reveal.pen()?;
        let d = self.spacing() * self.dpr;
        let r = ease * (0.5 * self.w.hypot(self.h) + self.lift() + 2.0 * d);
        Some(PI * r * r / d)
    }

    fn tick(&mut self) {
        if self.reveal.waiting_for_pen() && self.greeting.active().is_none() {
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
            let quicken = if self.waiting { 6.0 } else { 1.0 };
            self.t += dt * speed * 0.9 * quicken;
            self.move_flares(dt);
        } else if !self.motion && self.e_warp == 0.0 {
            self.e_warp = CONTROLS.warp * 0.35;
            self.e_disp = CONTROLS.disp * 0.35;
        }
    }

    fn first_flare_turn(&self) -> f32 {
        let mn = self.w.min(self.h);
        ((SUBJECT * 1.25 * mn + self.lift()) / (self.spacing() * self.dpr)).max(4.0)
            * (1.0 - self.frame_progress())
            + 4.0 * self.frame_progress()
    }

    fn move_flares(&mut self, dt: f32) {
        if self.w <= 0.0 {
            return;
        }
        let d = self.spacing() * self.dpr;
        let core = self.core();
        let perimeter = 4.0 * (core[2] + core[3]);
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
            let along = TAU * d * (p + 0.5) + perimeter;
            let next = p + dir.signum() * dt * 8.0 * self.dpr / along.max(1.0);
            self.flares[i] = if next > reach {
                first.ceil() + next.rem_euclid(1.0)
            } else if next < first {
                reach.floor() + next.rem_euclid(1.0)
            } else {
                next
            };
            if (self.flares[i] - next).abs() > 0.5 {
                found[i] = f32::NAN;
            }
        }
        self.flare_r.set(found);
    }

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
        let theme = Theme::of(window, cx);
        self.draw(window, &theme);
        self.follow_greeting(cx);
        if self.animating() {
            window.request_animation_frame();
        }

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
