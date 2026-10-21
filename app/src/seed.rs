//! The visitor's seed, as the artifact deals it: hashed from the browser and the moment
//! they arrived, so every visit draws its own plate, and the root of every random choice
//! the plate makes. `#s<hex>` in the URL replays a plate. A first-party cookie remembers
//! only that the greeting has been written for them.

/// FNV-1a over UTF-16 code units, as the old site and the artifact hash strings.
pub fn hash(s: &str) -> u32 {
    let mut h: u32 = 0x811c9dc5;
    for unit in s.encode_utf16() {
        h ^= unit as u32;
        h = h.wrapping_mul(0x01000193);
    }
    h
}

/// mulberry32: a small, fast, seedable stream of floats in [0, 1).
pub struct Rng(u32);

impl Rng {
    pub fn new(seed: u32) -> Self {
        Self(seed)
    }

    pub fn next(&mut self) -> f32 {
        self.0 = self.0.wrapping_add(0x6D2B79F5);
        let mut t = self.0;
        t = (t ^ (t >> 15)).wrapping_mul(1 | t);
        t = (t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t))) ^ t;
        ((t ^ (t >> 14)) as f64 / 4294967296.0) as f32
    }

    pub fn pick<T: Copy>(&mut self, items: &[T]) -> T {
        items[((self.next() * items.len() as f32) as usize).min(items.len() - 1)]
    }
}

/// What the cookie remembers about this visitor.
#[derive(Clone, Copy, Debug)]
pub struct Visitor {
    pub seed: u32,
    /// the greeting has already been written for them once
    pub seen_intro: bool,
}

const COOKIE: &str = "burin";

#[cfg(target_family = "wasm")]
pub fn visitor() -> Visitor {
    use wasm_bindgen::JsCast as _;
    let window = web_sys::window();
    let doc = window
        .as_ref()
        .and_then(|w| w.document())
        .and_then(|d| d.dyn_into::<web_sys::HtmlDocument>().ok());
    let hash_seed = window
        .as_ref()
        .and_then(|w| w.location().hash().ok())
        .and_then(|h| {
            h.strip_prefix("#s")
                .and_then(|v| u32::from_str_radix(v, 16).ok())
        });

    let cookie = doc
        .as_ref()
        .and_then(|d| d.cookie().ok())
        .unwrap_or_default();
    let stored = cookie.split(';').find_map(|kv| {
        let (k, v) = kv.trim().split_once('=')?;
        if k != COOKIE {
            return None;
        }
        // `1`, or the older `<seed>.<seen>` from when the cookie kept the seed too
        let seen = v.rsplit('.').next().unwrap_or(v);
        Some(seen == "1")
    });

    let ua = window
        .as_ref()
        .and_then(|w| w.navigator().user_agent().ok())
        .unwrap_or_default();
    let now = js_sys::Date::now();
    Visitor {
        seed: hash_seed.unwrap_or_else(|| hash(&format!("{ua}|{now}"))),
        seen_intro: stored.unwrap_or(false),
    }
}

#[cfg(not(target_family = "wasm"))]
pub fn visitor() -> Visitor {
    Visitor {
        seed: 0x5eed_0001,
        seen_intro: false,
    }
}

/// Remember whether the intro has played (the seed is never stored).
#[cfg(target_family = "wasm")]
pub fn remember(seen_intro: bool) {
    use wasm_bindgen::JsCast as _;
    let Some(doc) = web_sys::window()
        .and_then(|w| w.document())
        .and_then(|d| d.dyn_into::<web_sys::HtmlDocument>().ok())
    else {
        return;
    };
    let value = format!(
        "{COOKIE}={}; Max-Age=31536000; Path=/; SameSite=Lax",
        if seen_intro { 1 } else { 0 }
    );
    let _ = doc.set_cookie(&value);
}

#[cfg(not(target_family = "wasm"))]
pub fn remember(_: bool) {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fnv_matches_js() {
        // reference values from the JS implementation (Math.imul, >>> 0)
        assert_eq!(hash(""), 0x811c9dc5);
        assert_eq!(hash("a"), 0xe40c292c);
        assert_eq!(hash("foobar"), 0xbf9cf968);
    }

    #[test]
    fn mulberry_is_stable() {
        let mut r = Rng::new(1);
        let a = r.next();
        let mut r2 = Rng::new(1);
        assert_eq!(a, r2.next());
        assert!((0.0..1.0).contains(&a));
    }
}
