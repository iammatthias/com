use std::f32::consts::{PI, TAU};

use gpui::{Pixels, Point};

use super::{CONTROLS, Plate};

impl Plate {
    pub(super) fn hit(&self, pos: Point<Pixels>) -> Option<usize> {
        let a = &self.atlas;
        let (w, h, dpr, v, z) = (self.w, self.h, self.dpr, self.view, &self.deal);
        let rv = self.reveal.progress();
        let fr = self.frame_progress();
        let core = self.core();
        let fx = f32::from(pos.x) * dpr;
        let fy = h - f32::from(pos.y) * dpr;
        let px_ = (fx - w / 2.0 - v.x) / v.z;
        let py = (fy - h / 2.0 - self.lift() - v.y) / v.z;
        let mn = w.min(h);
        let d = self.spacing() * dpr;
        let (pcx, pcy) = (px_ - core[0], py - core[1]);
        if core_dist(pcx, pcy, core[2], core[3]) < 0.0 && fr > 0.001 {
            return None;
        }
        let (tt, an) = self.line_at(px_, py);
        let turn = tt.floor() + an;
        if turn < 0.0 {
            return None;
        }
        let q = 4.0 * (core[2] + core[3]);
        let tc = turn + 0.5;
        let s_arc = q * tc + PI * d * tc * tc;
        let sc = a.font_ref / (d * CONTROLS.em);
        let raw = s_arc * sc + self.text_start();
        if raw < 0.0 {
            return None;
        }
        let u = raw.rem_euclid(a.text_len);
        let i = a.segs.iter().position(|s| u >= s.x0 && u < s.x1)?;
        let seg = &a.segs[i];
        seg.title.href.as_ref()?;
        let s_mid = s_arc + ((seg.x0 + seg.x1) / 2.0 - u) / sc;
        let sg = s_mid / d;
        let mm = (sg * 0.011 * z.mph[2] - self.t + z.mph[0]).sin()
            + 0.55 * (sg * 0.027 * z.mph[2] + self.t * 0.63 + z.mph[1]).sin()
            + CONTROLS.bias;
        let tn = (-q + (q * q + 4.0 * PI * d * s_mid.max(0.0)).sqrt()) / (2.0 * PI * d) - 0.5;
        let first = 6.0 + (1.0 - 6.0) * fr;
        let start = self.text_start();
        let s0 = -start / sc;
        let t0 = (-q + (q * q + 4.0 * PI * d * s0.max(0.0)).sqrt()) / (2.0 * PI * d) - 0.5;
        let held = if start < -0.001 {
            1.0 - smooth(t0 + 1.5, t0 + 3.0, tn)
        } else {
            0.0
        };
        let mut rf = if tn < first {
            0.0
        } else {
            ((mm + 0.3) / 0.6).clamp(0.0, 1.0).max(held)
        };
        let rad = d * (tn + 0.5);
        let ang = (tn.rem_euclid(1.0) - 0.5) * TAU;
        let (ax, ay) = (rad * ang.cos() / mn, (rad * ang.sin() + self.lift()) / mn);
        let oval = (ax / (SUBJECT * 0.82)).hypot(ay / (SUBJECT * 1.02));
        let pad = FACE_CLEAR * d / (SUBJECT * 0.9 * mn);
        rf *= 1.0 - smooth(0.08, 0.3, smooth(1.12 + pad, 0.92 + pad, oval) * (1.0 - fr));
        rf *= rv;
        (rf > 0.6 && (u - seg.x0) < rf * (seg.x1 - seg.x0)).then_some(i)
    }

    fn line_at(&self, px: f32, py: f32) -> (f32, f32) {
        let (rv, fr, core, z) = (
            self.reveal.progress(),
            self.frame_progress(),
            self.core(),
            &self.deal,
        );
        let mn = self.w.min(self.h);
        let d = self.spacing() * self.dpr;
        let (qx, qy) = (px / mn, py / mn);
        let qr = qx.hypot(qy);
        let ang = py.atan2(px);
        let (pcx, pcy) = (px - core[0], py - core[1]);
        let dist = core_dist(pcx, pcy, core[2], core[3]);
        let tn0 = tone(qx, qy + self.lift() / mn);
        let dark = 0.06 + (tn0 + (0.1 - tn0) * fr - 0.06) * rv;
        let calm =
            smooth(0.0, 0.12, qr) + (smooth(0.0, 6.0 * d, dist) - smooth(0.0, 0.12, qr)) * fr;
        let rr = dist
            + d * (self.e_warp * z.warp(qx, qy, qr, ang, self.t) * calm
                + self.e_disp * (dark - 0.5))
                * rv;
        let an = core_turn(pcx, pcy, core[2], core[3], rr.max(0.0));
        (rr / d - an, an)
    }

    pub(super) fn point_on_line(&self, p: f32, from: f32) -> ([f32; 2], f32) {
        let d = self.spacing() * self.dpr;
        let core = self.core();
        let target = p + 0.5;
        let theta = (p.rem_euclid(1.0) - 0.5) * TAU;
        let (cx, cy) = (theta.cos(), theta.sin());
        let edge = if cx.abs() * core[3] > cy.abs() * core[2] {
            core[2] / cx.abs().max(1e-4)
        } else {
            core[3] / cy.abs().max(1e-4)
        };
        let mut r = if from.is_finite() {
            from
        } else {
            edge + d * (p + 0.5)
        };
        for _ in 0..16 {
            let (tt, an) = self.line_at(core[0] + cx * r, core[1] + cy * r);
            let step = (target - (tt + an)) * d;
            r = (r + step.clamp(-0.5 * d, 0.5 * d)).max(0.0);
            if step.abs() < 0.05 {
                break;
            }
        }
        ([core[0] + cx * r, core[1] + cy * r], r)
    }
}

fn core_dist(x: f32, y: f32, bx: f32, by: f32) -> f32 {
    let (dx, dy) = (x.abs() - bx, y.abs() - by);
    dx.max(0.0).hypot(dy.max(0.0)) + dx.max(dy).min(0.0)
}

fn core_turn(x: f32, y: f32, bx: f32, by: f32, d: f32) -> f32 {
    let total = 4.0 * (bx + by) + TAU * d;
    let l = if x < -bx && y.abs() <= by {
        if y <= 0.0 { -y } else { total - y }
    } else if x < -bx && y < -by {
        by + d * ((y + by).atan2(x + bx) + PI)
    } else if x.abs() <= bx && y < 0.0 {
        by + d * PI * 0.5 + (x + bx)
    } else if x > bx && y < -by {
        by + d * PI * 0.5 + 2.0 * bx + d * ((y + by).atan2(x - bx) + PI * 0.5)
    } else if x > bx && y.abs() <= by {
        by + d * PI + 2.0 * bx + (y + by)
    } else if x > bx && y > by {
        3.0 * by + d * PI + 2.0 * bx + d * (y - by).atan2(x - bx)
    } else if x.abs() <= bx && y > 0.0 {
        3.0 * by + d * PI * 1.5 + 2.0 * bx + (bx - x)
    } else {
        3.0 * by + d * PI * 1.5 + 4.0 * bx + d * ((y - by).atan2(x + bx) - PI * 0.5)
    };
    (l / total.max(1e-3)).clamp(0.0, 1.0)
}

fn smooth(a: f32, b: f32, x: f32) -> f32 {
    let t = ((x - a) / (b - a)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

pub(super) const PORTRAIT: &[u8] = include_bytes!("../portrait.r8");
pub(super) const PORTRAIT_SIDE: u32 = 256;
pub(super) const SUBJECT: f32 = 0.264;
pub(super) const FACE_CLEAR: f32 = 1.5;

fn tone(qx: f32, qy: f32) -> f32 {
    if qx.abs() > SUBJECT || qy.abs() > SUBJECT {
        return 0.06;
    }
    let n = PORTRAIT_SIDE as f32;
    let x = ((0.5 + qx / (2.0 * SUBJECT)) * n - 0.5).clamp(0.0, n - 1.0);
    let y = ((0.5 - qy / (2.0 * SUBJECT)) * n - 0.5).clamp(0.0, n - 1.0);
    let (x0, y0) = (x.floor() as usize, y.floor() as usize);
    let (x1, y1) = (
        (x0 + 1).min(PORTRAIT_SIDE as usize - 1),
        (y0 + 1).min(PORTRAIT_SIDE as usize - 1),
    );
    let (fx, fy) = (x - x0 as f32, y - y0 as f32);
    let at = |x: usize, y: usize| PORTRAIT[y * PORTRAIT_SIDE as usize + x] as f32 / 255.0;
    let top = at(x0, y0) + (at(x1, y0) - at(x0, y0)) * fx;
    let bottom = at(x0, y1) + (at(x1, y1) - at(x0, y1)) * fx;
    (top + (bottom - top) * fy).clamp(0.04, 0.95)
}
