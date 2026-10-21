//! The plate as a frame: the line winding out of the spiral to sit round a page's reading
//! column, following it as it scrolls, and winding back home.

use gpui::{Bounds, Pixels, Size, px};

use crate::overlay::Probe;

#[derive(Default)]
pub(super) struct Frame {
    /// where the page's reading column was last painted, or None for the home spiral
    target: Option<Probe>,
    /// the last page's probe: followed while the frame winds back home
    last_probe: Option<Probe>,
    /// the last framed rect, kept while the line unwinds back to a spiral
    rect: Option<Bounds<Pixels>>,
    /// the reading column's own size when the frame last settled round it
    column_size: Option<Size<Pixels>>,
    /// 0 = spiral, 1 = framing the page; eased in `progress()`
    k: f32,
    /// the last frame's step, seconds (eases that follow a target scale by it)
    dt: f32,
    settled: bool,
}

impl Frame {
    /// Frame the reading column the probe measures, or `None` to wind back into the spiral.
    pub fn set(&mut self, page: Option<Probe>) {
        if page.is_none() {
            self.settled = false;
        }
        if let Some(p) = page.as_ref() {
            self.last_probe = Some(p.clone());
        }
        self.target = page;
    }

    /// A new page is on its way: don't call the frame open until it has re-measured.
    pub fn unsettle(&mut self) {
        self.settled = false;
    }

    /// There is a page to frame (the line is winding out to it, or round it).
    pub fn has_page(&self) -> bool {
        self.target.is_some()
    }

    /// The line has begun winding round a page (or not yet back to a spiral): the plate is a
    /// frame, and pointer, wheel and pinch leave it alone.
    pub fn on_page(&self) -> bool {
        self.k > 0.01
    }

    /// Wound all the way out round a page.
    pub fn round_page(&self) -> bool {
        self.target.is_some() && self.k >= 1.0
    }

    /// How far the line has wound out round the page, eased 0..1.
    pub fn progress(&self) -> f32 {
        let x = self.k.clamp(0.0, 1.0);
        x * x * x * (x * (x * 6.0 - 15.0) + 10.0)
    }

    /// The line has finished winding out and sits exactly round the column: content may show.
    pub fn open(&self) -> bool {
        self.k >= 1.0 && self.settled
    }

    /// Still winding out or back, or not yet settled round its page.
    pub fn moving(&self) -> bool {
        (self.k - self.goal()).abs() > 1e-4 || (self.target.is_some() && !self.settled)
    }

    fn goal(&self) -> f32 {
        if self.target.is_some() { 1.0 } else { 0.0 }
    }

    /// The line takes a little under a second to wind out to a page frame, or back.
    pub fn step(&mut self, dt: f32) {
        self.dt = dt;
        let goal = self.goal();
        self.k += (goal - self.k).signum() * (dt / 0.9).min((goal - self.k).abs());
    }

    /// The column's current bounds (window px), with a margin of paper round it; it moves as the
    /// page scrolls.
    pub fn follow(&mut self, phone: bool) {
        let Some(b) = self
            .target
            .as_ref()
            .or(self.last_probe.as_ref())
            .and_then(|p| p.bounds())
        else {
            return;
        };
        // an empty column is a page still loading: the frame must settle again on what arrives
        if b.size.height <= px(1.) {
            self.settled = false;
            return;
        }
        // a phone's margins are narrow: keep the frame close so the line still shows beside the text
        let margin = if phone { px(12.) } else { px(28.) };
        // the whole column, however long: the frame scrolls with the text, all the way down
        let (top, bottom) = (b.origin.y - margin, b.origin.y + b.size.height + margin);
        let target = Bounds::new(
            gpui::point(b.origin.x - margin, top),
            gpui::size(b.size.width + margin * 2., (bottom - top).max(px(1.))),
        );
        // scrolling moves the column without resizing it: follow exactly, or the lines would cross the text;
        // a new page resizes it: ease the frame there
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
                // a quarter of the way per 60 Hz frame, at any frame rate
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

    /// The core the line winds around, plate device px (y up): centre.xy, half-size.xy, for a
    /// plate `w` × `h` device px at `dpr` whose spiral starts `lift` above the middle.
    pub fn core(&self, dpr: f32, w: f32, h: f32, lift: f32) -> [f32; 4] {
        let e = self.progress();
        let Some(r) = self.rect else { return [0.0; 4] };
        // the column is laid out at its own size from the start: the core grows from the spiral's
        // start to it as the frame opens
        let cx = (f32::from(r.origin.x) + f32::from(r.size.width) / 2.0) * dpr - w / 2.0;
        let cy = h / 2.0 - (f32::from(r.origin.y) + f32::from(r.size.height) / 2.0) * dpr - lift;
        let (bx, by) = (
            f32::from(r.size.width) / 2.0 * dpr,
            f32::from(r.size.height) / 2.0 * dpr,
        );
        [cx * e, cy * e, bx * e, by * e]
    }
}
