use gpui::Rgba;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Oklch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
}

pub const fn oklch(l: f32, c: f32, h: f32) -> Oklch {
    Oklch { l, c, h }
}

pub const WHITE: Oklch = oklch(1.0, 0.0, 0.0);

impl Oklch {
    fn linear_srgb(self) -> [f64; 3] {
        let (l, c, h) = (self.l as f64, self.c as f64, (self.h as f64).to_radians());
        let (a, b) = (c * h.cos(), c * h.sin());
        let l_ = (l + 0.3963377774 * a + 0.2158037573 * b).powi(3);
        let m_ = (l - 0.1055613458 * a - 0.0638541728 * b).powi(3);
        let s_ = (l - 0.0894841775 * a - 1.2914855480 * b).powi(3);
        [
            4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
            -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
            -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
        ]
    }

    pub fn rgba(self) -> Rgba {
        self.alpha(1.0)
    }

    pub fn alpha(self, alpha: f32) -> Rgba {
        let [r, g, b] = self.linear_srgb().map(|v| gamma(v.clamp(0.0, 1.0)) as f32);
        Rgba::new(r, g, b, alpha)
    }
}

fn gamma(v: f64) -> f64 {
    if v <= 0.0031308 {
        12.92 * v
    } else {
        1.055 * v.powf(1.0 / 2.4) - 0.055
    }
}

#[cfg(test)]
pub fn hex(c: Rgba) -> u32 {
    let b = |v: f32| (v * 255.0).round() as u32;
    b(c.color.red) << 16 | b(c.color.green) << 8 | b(c.color.blue)
}

#[cfg(test)]
pub fn in_gamut(c: Oklch) -> bool {
    c.linear_srgb()
        .iter()
        .all(|v| (-1e-6..=1.0 + 1e-6).contains(v))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_ends_of_lightness_are_white_and_black() {
        assert_eq!(hex(oklch(1.0, 0.0, 0.0).rgba()), 0xffffff);
        assert_eq!(hex(oklch(0.0, 0.0, 0.0).rgba()), 0x000000);
        assert_eq!(hex(oklch(1.0, 0.0, 200.0).rgba()), 0xffffff);
    }

    #[test]
    fn mid_lightness_grey_is_the_cube_of_its_lightness_through_the_srgb_curve() {
        assert_eq!(hex(oklch(0.5, 0.0, 0.0).rgba()), 0x636363);
    }

    #[test]
    fn the_published_oklch_of_srgb_primaries_lands_on_them() {
        assert_eq!(hex(oklch(0.627955, 0.257683, 29.2339).rgba()), 0xff0000);
        assert_eq!(hex(oklch(0.86644, 0.294827, 142.4953).rgba()), 0x00ff00);
        assert_eq!(hex(oklch(0.452014, 0.313214, 264.052).rgba()), 0x0000ff);
    }

    #[test]
    fn colour_past_the_srgb_gamut_clamps_to_its_edge() {
        let brighter_than_white = oklch(1.2, 0.0, 0.0);
        assert!(!in_gamut(brighter_than_white));
        assert_eq!(hex(brighter_than_white.rgba()), 0xffffff);
        let darker_than_black = oklch(-0.1, 0.0, 0.0);
        assert!(!in_gamut(darker_than_black));
        assert_eq!(hex(darker_than_black.rgba()), 0x000000);
        assert!(in_gamut(WHITE));
    }

    #[test]
    fn alpha_rides_along_without_touching_the_colour() {
        let rim = WHITE.alpha(0.7);
        assert_eq!(rim.alpha, 0.7);
        assert_eq!(hex(rim), 0xffffff);
    }
}
