#[cfg(not(target_family = "wasm"))]
pub use usvg_real::*;

#[cfg(target_family = "wasm")]
pub use web::*;

#[cfg(target_family = "wasm")]
mod web {
    pub use fontdb;

    pub struct Font;

    pub type FontSelectionFn<'a> = Box<dyn Kept + 'a>;
    pub type FallbackSelectionFn<'a> = Box<dyn Kept + 'a>;

    pub trait Kept: Send + Sync {}
    impl<T: Send + Sync> Kept for T {}

    pub struct FontResolver<'a> {
        pub select_font: FontSelectionFn<'a>,
        pub select_fallback: FallbackSelectionFn<'a>,
    }

    type SelectFont = Box<dyn Fn(&Font, &mut std::sync::Arc<fontdb::Database>) -> Option<fontdb::ID> + Send + Sync>;
    type SelectFallback = Box<dyn Fn(char, &[fontdb::ID], &mut std::sync::Arc<fontdb::Database>) -> Option<fontdb::ID> + Send + Sync>;

    impl FontResolver<'_> {
        pub fn default_font_selector() -> SelectFont {
            Box::new(|_, _| None)
        }
        pub fn default_fallback_selector() -> SelectFallback {
            Box::new(|_, _, _| None)
        }
    }

    impl Default for FontResolver<'_> {
        fn default() -> Self {
            Self { select_font: Box::new(()), select_fallback: Box::new(()) }
        }
    }

    #[derive(Default)]
    pub struct Options<'a> {
        pub font_resolver: FontResolver<'a>,
    }

    #[derive(Clone, Copy, Debug)]
    pub struct Size {
        width: f32,
        height: f32,
    }

    impl Size {
        pub fn width(&self) -> f32 {
            self.width
        }
        pub fn height(&self) -> f32 {
            self.height
        }
    }

    pub struct Tree {
        size: Size,
    }

    impl Tree {
        pub fn from_data(_: &[u8], _: &Options) -> Result<Self, Error> {
            Err(Error::Unsupported)
        }
        pub fn size(&self) -> Size {
            self.size
        }
    }

    #[derive(Debug)]
    pub enum Error {
        InvalidSize,
        Unsupported,
    }

    impl std::fmt::Display for Error {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                Error::InvalidSize => f.write_str("SVG has an invalid size"),
                Error::Unsupported => f.write_str("SVG isn't drawn by this build (the browser draws it)"),
            }
        }
    }

    impl std::error::Error for Error {}
}
