use gpui::{Bounds, Pixels, Size, px};

use crate::overlay::Probe;

#[derive(Default)]
pub(super) struct Frame {
    target: Option<Probe>,
    last_probe: Option<Probe>,
    rect: Option<Bounds<Pixels>>,
    column_size: Option<Size<Pixels>>,
    k: f32,
    dt: f32,
    settled: bool,
}

impl Frame {
    pub fn set(&mut self, page: Option<Probe>) {
        if page.is_none() {
            self.settled = false;
        }
        if let Some(p) = page.as_ref() {
            self.last_probe = Some(p.clone());
        }
        self.target = page;
    }

    pub fn unsettle(&mut self) {
        self.settled = false;
    }

    pub fn has_page(&self) -> bool {
        self.target.is_some()
    }

    pub fn on_page(&self) -> bool {
        self.k > 0.01
    }

    pub fn round_page(&self) -> bool {
        self.target.is_some() && self.k >= 1.0
    }

    pub fn progress(&self) -> f32 {
        let x = self.k.clamp(0.0, 1.0);
        x * x * x * (x * (x * 6.0 - 15.0) + 10.0)
    }

    pub fn open(&self) -> bool {
        self.k >= 1.0 && self.settled
    }

    pub fn moving(&self) -> bool {
        (self.k - self.goal()).abs() > 1e-4 || (self.target.is_some() && !self.settled)
    }

    fn goal(&self) -> f32 {
        if self.target.is_some() { 1.0 } else { 0.0 }
    }

    pub fn step(&mut self, dt: f32) {
        self.dt = dt;
        let goal = self.goal();
        self.k += (goal - self.k).signum() * (dt / 0.9).min((goal - self.k).abs());
    }

    pub fn follow(&mut self, phone: bool) {
        let Some(b) = self
            .target
            .as_ref()
            .or(self.last_probe.as_ref())
            .and_then(|p| p.bounds())
        else {
            return;
        };
        if b.size.height <= px(1.) {
            self.settled = false;
            return;
        }
        let margin = if phone { px(12.) } else { px(28.) };
        let (top, bottom) = (b.origin.y - margin, b.origin.y + b.size.height + margin);
        let target = Bounds::new(
            gpui::point(b.origin.x - margin, top),
            gpui::size(b.size.width + margin * 2., (bottom - top).max(px(1.))),
        );
        let resized = self.column_size.is_some_and(|s| {
            (s.height - b.size.height).abs() > px(1.) || (s.width - b.size.width).abs() > px(1.)
        });
        if !resized || self.settled {
            self.column_size = Some(b.size);
        }
        self.rect = Some(match self.rect {
            Some(cur)
                if self.round_page()
                    && resized
                    && ((cur.size.height - target.size.height).abs() > px(1.)
                        || (cur.size.width - target.size.width).abs() > px(1.)) =>
            {
                let k = 1.0 - (-self.dt * 17.3).exp();
                let mix = |a: Pixels, b: Pixels| a + (b - a) * k;
                Bounds::new(
                    gpui::point(
                        mix(cur.origin.x, target.origin.x),
                        mix(cur.origin.y, target.origin.y),
                    ),
                    gpui::size(
                        mix(cur.size.width, target.size.width),
                        mix(cur.size.height, target.size.height),
                    ),
                )
            }
            _ => target,
        });
        self.settled = self.rect.is_some_and(|r| {
            (r.size.height - target.size.height).abs() < px(4.)
                && (r.size.width - target.size.width).abs() < px(4.)
        });
    }

    pub fn core(&self, dpr: f32, w: f32, h: f32, lift: f32) -> [f32; 4] {
        let e = self.progress();
        let Some(r) = self.rect else { return [0.0; 4] };
        let cx = (f32::from(r.origin.x) + f32::from(r.size.width) / 2.0) * dpr - w / 2.0;
        let cy = h / 2.0 - (f32::from(r.origin.y) + f32::from(r.size.height) / 2.0) * dpr - lift;
        let (bx, by) = (
            f32::from(r.size.width) / 2.0 * dpr,
            f32::from(r.size.height) / 2.0 * dpr,
        );
        [cx * e, cy * e, bx * e, by * e]
    }
}
