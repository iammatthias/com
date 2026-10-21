//! Parse once per payload, not every frame: block trees (with their recipes and series
//! already laid out) cached by a hash of what produced them.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::api::{Media, Series};

use super::md::{self, Block};
use super::series::{self, SeriesTree};

pub struct Parsed {
    pub blocks: Vec<Block>,
    pub series: HashMap<String, SeriesTree>,
    pub words: usize,
}

/// Trees kept before those of earlier pages go. The page in view keeps all of its own (a feed
/// scrolled far has more than this, and losing them would mean parsing every post every render).
const CAP: usize = 32;

thread_local! {
    /// each tree with the page it was last used on
    static CACHE: RefCell<HashMap<u64, (u64, Rc<Parsed>)>> = RefCell::new(HashMap::new());
    static PAGE: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

/// A new page is in: what the last one parsed may now be let go.
pub fn next_page() {
    PAGE.set(PAGE.get() + 1);
}

fn fnv(h: &mut u64, bytes: &[u8]) {
    for b in bytes {
        *h ^= *b as u64;
        *h = h.wrapping_mul(0x100000001b3);
    }
}

/// The tree for `markdown` (and any series it embeds), parsed on first sight.
///
/// `identity` is the record's cid when it has one. The Worker's `renderKey` is the cid plus
/// the cids of the series the body embeds (`worker/src/lib/render-key.ts`); the app gets the
/// series bodies rather than their cids, so it hashes those instead, which changes exactly
/// when they would. Without an identity (feed posts, plain pages) the markdown itself is hashed.
pub fn parsed(
    identity: Option<&str>,
    markdown: &str,
    media: &HashMap<String, Media>,
    series: &HashMap<String, Series>,
) -> Rc<Parsed> {
    let mut h = 0xcbf29ce484222325u64;
    match identity.filter(|c| !c.is_empty()) {
        Some(cid) => {
            fnv(&mut h, b"cid:");
            fnv(&mut h, cid.as_bytes());
        }
        None => fnv(&mut h, markdown.as_bytes()),
    }
    let mut slugs: Vec<&String> = series.keys().collect();
    slugs.sort();
    for s in slugs {
        fnv(&mut h, s.as_bytes());
        fnv(&mut h, series[s].body.as_bytes());
    }
    // media kinds change how series group (still + video pairs), so they are part of the key
    let mut kinds: Vec<(&String, &String)> = media.iter().map(|(cid, m)| (cid, &m.mime)).collect();
    kinds.sort();
    for (cid, mime) in kinds {
        fnv(&mut h, cid.as_bytes());
        fnv(&mut h, mime.as_bytes());
    }

    let page = PAGE.get();
    let hit = CACHE.with(|c| {
        c.borrow_mut().get_mut(&h).map(|(used, p)| {
            *used = page;
            p.clone()
        })
    });
    if let Some(hit) = hit {
        return hit;
    }
    let blocks = md::parse(markdown);
    let trees = series
        .iter()
        .map(|(slug, s)| (slug.clone(), series::build(slug, s.layout, &s.body, media)))
        .collect();
    let words = md::plain_text(&blocks).split_whitespace().count();
    let parsed = Rc::new(Parsed {
        blocks,
        series: trees,
        words,
    });
    CACHE.with(|c| {
        let mut c = c.borrow_mut();
        if c.len() >= CAP && c.values().any(|(used, _)| *used != page) {
            c.retain(|_, (used, _)| *used == page);
        }
        c.insert(h, (page, parsed.clone()));
    });
    parsed
}
