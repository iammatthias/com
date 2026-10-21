//! Markdown → a small block tree. Pure Rust (no gpui) so it can be unit-tested on the host
//! and parsed once per payload; `render` turns the tree into elements every frame.
//!
//! Ported behaviour from the Astro site's `doc-render.ts`:
//! - `<ff-*>` components are lifted out before parsing (outside code), like `extractDocComponents`
//! - `![alt](blob://cid)` / `![](series://slug)` embeds become figures and series blocks
//! - ```` ```recipe ```` fences become recipe blocks, ```` ```mermaid ```` a labelled source block
//! - `> [!NOTE]` style alerts become callouts

mod builder;
mod pre;
mod types;

use pulldown_cmark::{Options, Parser};

use builder::Builder;
use pre::{extract_components, normalize_alerts};
pub use types::*;

/// Parse a markdown body into blocks.
pub fn parse(markdown: &str) -> Vec<Block> {
    parse_with(markdown, ParseOptions::default())
}

pub fn parse_with(markdown: &str, opts: ParseOptions) -> Vec<Block> {
    let (source, components) = extract_components(markdown);
    let mut b = Builder::new(opts, components);
    let options = Options::ENABLE_TABLES
        | Options::ENABLE_FOOTNOTES
        | Options::ENABLE_STRIKETHROUGH
        | Options::ENABLE_TASKLISTS
        | Options::ENABLE_GFM;
    let normalized = normalize_alerts(&source);
    for event in Parser::new_ext(&normalized, options) {
        b.event(event);
    }
    b.finish()
}

/// One paragraph's worth of inline markdown as a single run (recipe notes, step details).
pub fn parse_inline(s: &str) -> Rich {
    let mut out = Rich::default();
    for block in parse(s) {
        if let Block::Para(r) = block {
            if !out.text.is_empty() {
                out.push(" ", Marks::default());
            }
            let base = out.links.len() as u16;
            for (range, m) in &r.spans {
                let link = m.link.map(|l| l + base);
                out.push(&r.text[range.clone()], Marks { link, ..*m });
            }
            out.links.extend(r.links);
        }
    }
    if out.text.is_empty() {
        Rich::plain(s.trim())
    } else {
        out
    }
}

/// Plain text of a block tree, for excerpts and reading-time estimates.
pub fn plain_text(blocks: &[Block]) -> String {
    fn walk(blocks: &[Block], out: &mut String) {
        for b in blocks {
            match b {
                Block::Heading { text, .. } | Block::Para(text) => {
                    out.push_str(&text.text);
                    out.push(' ');
                }
                Block::Quote(body) | Block::Callout { body, .. } | Block::Reveal { body, .. } => {
                    walk(body, out)
                }
                Block::List { items, .. } => {
                    for item in items {
                        walk(&item.body, out)
                    }
                }
                _ => {}
            }
        }
    }
    let mut out = String::new();
    walk(blocks, &mut out);
    out
}
