//! Pointing at the plate: hover and click on its titles, and on the home spiral, pan and zoom by
//! drag, wheel, trackpad, pinch and fingers. Round a page the plate is a frame and leaves all of
//! these to the text.

use std::cell::RefCell;
use std::rc::Rc;

use gpui::prelude::*;
use gpui::{Context, Div, MouseButton, Pixels, Point, ScrollDelta, Stateful, px};
use web_time::Instant;

use super::{Plate, View};

/// Touch gestures read straight from the browser, drained by the plate each frame.
#[derive(Default)]
pub(super) struct Touches {
    fingers: u32,
    /// when the last finger lifted: a flick's momentum scrolls keep arriving for a moment
    lifted: Option<Instant>,
    pan: (f32, f32),
    /// accumulated zoom factor and where (CSS px)
    pinch: Option<(f32, f32, f32)>,
}

impl Touches {
    /// Gestures from the browser from now on, gathered until the plate drains them.
    pub fn listen() -> Rc<RefCell<Self>> {
        let touches = Rc::new(RefCell::new(Self::default()));
        let sink = touches.clone();
        crate::route::on_touch_gesture(move |gesture| {
            use crate::route::Gesture;
            let mut t = sink.borrow_mut();
            match gesture {
                Gesture::Touch { fingers } => {
                    if fingers == 0 && t.fingers > 0 {
                        t.lifted = Some(Instant::now());
                    }
                    t.fingers = fingers;
                }
                Gesture::Pan { dx, dy } => {
                    t.pan.0 += dx;
                    t.pan.1 += dy;
                }
                Gesture::Pinch { factor, x, y } => {
                    let f = t.pinch.map_or(1.0, |p| p.0) * factor;
                    t.pinch = Some((f, x, y));
                }
            }
        });
        touches
    }
}

impl Plate {
    // ---- controls the site panel drives ----

    /// Zoom about the middle of the window.
    pub fn zoom_by(&mut self, factor: f32) {
        let mid = gpui::point(px(self.w / self.dpr / 2.0), px(self.h / self.dpr / 2.0));
        self.zoom_at(mid, factor);
    }

    pub fn reset_view(&mut self) {
        self.view = View {
            x: 0.0,
            y: 0.0,
            z: 1.0,
        };
    }

    pub fn zoom_percent(&self) -> u32 {
        (self.view.z * 100.0).round() as u32
    }

    /// Fingers on the glass: drag pans the spiral, pinch zooms it (only on the home plate;
    /// on a page the same touches scroll the text).
    pub(super) fn apply_touches(&mut self) {
        let (pan, pinch) = {
            let mut t = self.touches.borrow_mut();
            (std::mem::take(&mut t.pan), t.pinch.take())
        };
        if self.frame.has_page() {
            return;
        }
        self.view.x += pan.0 * self.dpr;
        self.view.y -= pan.1 * self.dpr;
        if let Some((factor, x, y)) = pinch {
            self.zoom_at(gpui::point(px(x), px(y)), factor);
        }
        if pan != (0.0, 0.0) {
            self.hover = None;
        }
    }

    /// A finger is down, or just lifted (its flick's scroll momentum is still arriving).
    pub(super) fn touching(&self) -> bool {
        let t = self.touches.borrow();
        t.fingers > 0 || t.lifted.is_some_and(|l| l.elapsed().as_millis() < 900)
    }

    fn zoom_at(&mut self, pos: Point<Pixels>, factor: f32) {
        let z = (self.view.z * factor).clamp(0.35, 14.0);
        if z == self.view.z {
            return;
        }
        let sx = f32::from(pos.x) * self.dpr - self.w / 2.0;
        let sy = (self.h - f32::from(pos.y) * self.dpr) - self.h / 2.0 - self.lift();
        let wx = (sx - self.view.x) / self.view.z;
        let wy = (sy - self.view.y) / self.view.z;
        self.view = View {
            x: sx - wx * z,
            y: sy - wy * z,
            z,
        };
    }

    /// The plate's own pointer, wheel and pinch handling, on its root element.
    pub(super) fn input(&self, root: Stateful<Div>, cx: &mut Context<Self>) -> Stateful<Div> {
        root.when(self.hover.is_some(), |d| d.cursor_pointer())
            // hovered only where nothing sits on top of the plate: leaving it for a panel or the
            // page puts any title tooltip away
            .on_hover(cx.listener(|this, over: &bool, _, cx| {
                this.over = *over;
                if !*over && this.hover.take().is_some() {
                    cx.notify();
                }
            }))
            .on_mouse_move(cx.listener(|this, e: &gpui::MouseMoveEvent, _, cx| {
                let on_page = this.frame.on_page();
                if let Some((from, moved)) = this.drag.filter(|_| !on_page) {
                    let (dx, dy) = (
                        f32::from(e.position.x - from.x),
                        f32::from(e.position.y - from.y),
                    );
                    this.view.x += dx * this.dpr;
                    this.view.y -= dy * this.dpr;
                    this.drag = Some((e.position, moved + dx.abs() + dy.abs()));
                }
                this.pointer = Some(e.position);
                let dragging = this.drag.is_some_and(|(_, m)| m > 5.0);
                // a title under a panel, the page or a control isn't the one being pointed at
                let was = this.hover;
                this.hover = if dragging || !this.over {
                    None
                } else {
                    this.hit(e.position)
                };
                if this.hover.is_some() {
                    this.hold_until = Some(Instant::now() + std::time::Duration::from_millis(1200));
                }
                // nothing pointed at before or now (the usual move): no re-render of the whole
                // tree for it (a tooltip that's showing follows the pointer, so that still draws)
                if was.is_none() && this.hover.is_none() && this.drag.is_none() {
                    return;
                }
                cx.notify();
            }))
            .on_mouse_down(
                MouseButton::Left,
                cx.listener(|this, e: &gpui::MouseDownEvent, _, _| {
                    this.drag = Some((e.position, 0.0));
                }),
            )
            .on_mouse_up(
                MouseButton::Left,
                cx.listener(|this, e: &gpui::MouseUpEvent, window, cx| {
                    let moved = this.drag.take().map(|(_, m)| m).unwrap_or(0.0);
                    // a double click resets the view, on its release (round a page the plate is a frame:
                    // no panning or resetting)
                    if moved <= 5.0 && e.click_count == 2 && !this.frame.on_page() {
                        this.view = View {
                            x: 0.0,
                            y: 0.0,
                            z: 1.0,
                        };
                    }
                    if moved <= 5.0 && e.click_count == 1 {
                        if let Some(href) = this
                            .hit(e.position)
                            .and_then(|i| this.atlas.segs[i].title.href.clone())
                        {
                            (this.nav)(href, window, cx);
                        }
                    }
                }),
            )
            .on_scroll_wheel(cx.listener(|this, e: &gpui::ScrollWheelEvent, _, cx| {
                // round a page the wheel scrolls the text, never the plate
                if this.frame.on_page() {
                    return;
                }
                // fingers are read directly (apply_touches); the scrolls gpui makes from them are ignored
                if this.touching() {
                    return;
                }
                match e.delta {
                    // a trackpad pinch arrives as ctrl+scroll: zoom about the pointer
                    ScrollDelta::Pixels(p) if e.modifiers.control => {
                        this.zoom_at(e.position, (f32::from(p.y) * 0.012).exp());
                    }
                    // a trackpad's two-finger scroll pans freely, both axes at once
                    ScrollDelta::Pixels(p) => {
                        this.view.x += f32::from(p.x) * this.dpr;
                        this.view.y -= f32::from(p.y) * this.dpr;
                        this.hover = None;
                    }
                    // a notched mouse wheel only goes one way: it zooms
                    ScrollDelta::Lines(l) => {
                        this.zoom_at(e.position, (l.y * 20.0 * 0.0018).exp());
                    }
                }
                cx.notify();
            }))
            .on_pinch(cx.listener(|this, e: &gpui::PinchEvent, _, cx| {
                if this.frame.on_page() {
                    return;
                }
                this.zoom_at(e.position, (1.0 + e.delta).max(0.2));
                cx.notify();
            }))
    }
}
