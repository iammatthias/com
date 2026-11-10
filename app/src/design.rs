use gpui::Window;

pub const CONTROL_RADIUS: f32 = 20.0;

pub const CONTROL_H: f32 = 40.0;

pub const INSET: f32 = 16.0;

pub const PANEL_W: f32 = 330.0;

pub const COLUMN_MAX_W: f32 = 680.0;

pub const PHONE_W: f32 = 600.0;

pub const NARROW_CONTROLS_W: f32 = 760.0;

pub const PLATE_SMALL_W: f32 = 520.0;

pub const BANNER_SMALL_W: f32 = 640.0;

pub fn is_phone(window: &Window) -> bool {
    f32::from(window.viewport_size().width) < PHONE_W
}

pub fn controls_cover_column(window: &Window) -> bool {
    f32::from(window.viewport_size().width) < NARROW_CONTROLS_W
}

pub const LABEL_SIZE: f32 = 11.0;
pub const LABEL_LEADING: f32 = 18.0;
pub const LABEL_TRACKING: f32 = 0.9;

pub const BODY_SIZE: f32 = 19.0;
pub const BODY_LEADING: f32 = 31.0;

pub const TITLE_SIZE: f32 = 40.0;
pub const TITLE_LEADING: f32 = 45.0;

pub const SCRIPT_BUTTON_SIZE: f32 = 19.0;
