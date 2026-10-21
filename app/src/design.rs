//! Design tokens: the layout measures, breakpoints and type sizes the site shares, so each is
//! changed in one place. Colours and faces live in `theme`.
//!
//! Every value is a plain `f32` in CSS px.

use gpui::Window;

// ---- the controls on the plate ----

/// Corner radius of the controls that sit on the plate (the pills and their panels). The plate
/// shader rounds their glass to the same radius.
pub const CONTROL_RADIUS: f32 = 20.0;

/// Height of a control pill, and of a panel's header row.
pub const CONTROL_H: f32 = 40.0;

/// How far the controls sit in from the window's corners (before the safe-area insets).
pub const INSET: f32 = 16.0;

/// A panel's width when open (less on a window too narrow to hold it beside the insets).
pub const PANEL_W: f32 = 330.0;

// ---- the reading column ----

/// The widest the reading column grows, in design px.
pub const COLUMN_MAX_W: f32 = 680.0;

// ---- breakpoints (window width, CSS px) ----

/// Below this the window is a phone: tighter margins, a smaller pixel budget, and an open panel
/// that spans the width and sends the other controls aside.
pub const PHONE_W: f32 = 600.0;

/// Below this the controls may cover the reading column, so their glass needs a veil.
pub const NARROW_CONTROLS_W: f32 = 760.0;

/// Below this the plate's lettering (and the greeting's spiral) is set a little smaller.
pub const PLATE_SMALL_W: f32 = 520.0;

/// Below this a record's terrazzo banner is drawn shorter.
pub const BANNER_SMALL_W: f32 = 640.0;

/// The window is phone-sized (narrower than `PHONE_W`).
pub fn is_phone(window: &Window) -> bool {
    f32::from(window.viewport_size().width) < PHONE_W
}

// ---- type ----

/// The small label: Inter, medium, tracked capitals (`content::label`).
pub const LABEL_SIZE: f32 = 11.0;
/// The label's line height.
pub const LABEL_LEADING: f32 = 18.0;
/// The label's letter spacing.
pub const LABEL_TRACKING: f32 = 0.9;

/// Reading text in the column.
pub const BODY_SIZE: f32 = 19.0;
/// Reading text's line height.
pub const BODY_LEADING: f32 = 31.0;

/// A page's title (Newsreader, large).
pub const TITLE_SIZE: f32 = 40.0;
/// A page title's line height.
pub const TITLE_LEADING: f32 = 45.0;

/// The script face on the controls: the pills' and panel headers' names.
pub const SCRIPT_BUTTON_SIZE: f32 = 19.0;
