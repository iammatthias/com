//! `![](series://slug)` → a series tree: grid tiles (stills, videos, still+video "live"
//! pairs), a flow of images and prose, or the phosphene triptych. Ported from the block
//! splitting in `doc-render.ts` and `series-captures.ts`. Pure Rust.

use std::collections::HashMap;

use crate::api::{Media, SeriesLayout};

use super::md::{self, Block, MediaSrc, ParseOptions, Rich};

#[derive(Clone, Debug, PartialEq)]
pub struct SeriesMedia {
    pub src: MediaSrc,
    pub alt: String,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Capture {
    Still(SeriesMedia),
    Live {
        still: SeriesMedia,
        movie: SeriesMedia,
    },
    Video(SeriesMedia),
}

#[derive(Clone, Debug, PartialEq)]
pub enum FlowPart {
    Media(SeriesMedia),
    Text(Vec<Block>),
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Stanza {
    pub lines: Vec<Block>,
    /// the trailing `*…*` paragraph, set as a small note
    pub note: Option<Rich>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum TriptychPart {
    Loose(Stanza),
    Panel {
        left: SeriesMedia,
        right: Option<SeriesMedia>,
        text: Vec<Stanza>,
        caption: Vec<Stanza>,
    },
}

#[derive(Clone, Debug, PartialEq)]
pub enum SeriesTree {
    Grid(Vec<Capture>),
    Flow(Vec<FlowPart>),
    Triptych(Vec<TriptychPart>),
    Empty,
}

enum Raw {
    Media(SeriesMedia),
    Text(String),
}

/// One whole-block embed: `![alt](blob://cid)` or `![alt](https://…/blobs/cid)`.
fn embed(block: &str) -> Option<SeriesMedia> {
    let rest = block.strip_prefix("![")?;
    let close = rest.find("](")?;
    let alt = &rest[..close];
    let dest = rest[close + 2..].strip_suffix(')')?;
    if alt.contains(']') || dest.contains(char::is_whitespace) {
        return None;
    }
    Some(SeriesMedia {
        src: MediaSrc::parse(dest)?,
        alt: alt.to_string(),
    })
}

fn tokenize(body: &str) -> Vec<Raw> {
    let mut blocks = Vec::new();
    let mut cur = String::new();
    for line in body.lines() {
        if line.trim().is_empty() {
            if !cur.trim().is_empty() {
                blocks.push(std::mem::take(&mut cur));
            }
            cur.clear();
        } else {
            cur.push_str(line);
            cur.push('\n');
        }
    }
    if !cur.trim().is_empty() {
        blocks.push(cur);
    }
    blocks
        .into_iter()
        .map(|b| {
            let t = b.trim();
            match embed(t) {
                Some(m) => Raw::Media(m),
                None => Raw::Text(t.to_string()),
            }
        })
        .collect()
}

fn is_video(m: &SeriesMedia, media: &HashMap<String, Media>) -> bool {
    m.src
        .cid()
        .and_then(|c| media.get(c))
        .is_some_and(Media::is_video)
}

pub fn group_captures(items: Vec<SeriesMedia>, media: &HashMap<String, Media>) -> Vec<Capture> {
    let mut out = Vec::new();
    let mut it = items.into_iter().peekable();
    while let Some(item) = it.next() {
        if is_video(&item, media) {
            out.push(Capture::Video(item));
            continue;
        }
        if let Some(movie) = it.next_if(|n| is_video(n, media)) {
            out.push(Capture::Live { still: item, movie });
        } else {
            out.push(Capture::Still(item));
        }
    }
    out
}

/// A stanza: `>` stripped, line breaks kept, a trailing all-italic paragraph lifted as a note.
pub fn stanza(raw: &str) -> Stanza {
    let inner: String = raw
        .lines()
        .map(|l| {
            let t = l.trim_start();
            let t = t
                .strip_prefix('>')
                .map(|r| r.strip_prefix(' ').unwrap_or(r))
                .unwrap_or(l);
            t.trim_end()
        })
        .collect::<Vec<_>>()
        .join("\n");
    let mut lines = md::parse_with(
        &inner,
        ParseOptions {
            keep_line_breaks: true,
        },
    );
    let note = match lines.last() {
        Some(Block::Para(r)) if r.all_em() && lines.len() > 1 => {
            let n = r.without_em();
            lines.pop();
            Some(n)
        }
        _ => None,
    };
    Stanza { lines, note }
}

pub fn build(
    slug: &str,
    layout: SeriesLayout,
    body: &str,
    media: &HashMap<String, Media>,
) -> SeriesTree {
    let raw = tokenize(body);
    let has_text = raw.iter().any(|r| matches!(r, Raw::Text(_)));
    let has_media = raw.iter().any(|r| matches!(r, Raw::Media(_)));
    if !has_text && !has_media {
        return SeriesTree::Empty;
    }

    if layout == SeriesLayout::Triptych || slug == "phosphene" {
        let mut parts = Vec::new();
        let mut it = raw.into_iter().peekable();
        while let Some(r) = it.next() {
            let left = match r {
                Raw::Text(t) => {
                    parts.push(TriptychPart::Loose(stanza(&t)));
                    continue;
                }
                Raw::Media(m) => m,
            };
            let mut text = Vec::new();
            while let Some(Raw::Text(_)) = it.peek() {
                if let Some(Raw::Text(t)) = it.next() {
                    text.push(stanza(&t));
                }
            }
            let right = match it.peek() {
                Some(Raw::Media(_)) => match it.next() {
                    Some(Raw::Media(m)) => Some(m),
                    _ => None,
                },
                _ => None,
            };
            let mut caption = Vec::new();
            while let Some(Raw::Text(_)) = it.peek() {
                if let Some(Raw::Text(t)) = it.next() {
                    caption.push(stanza(&t));
                }
            }
            parts.push(TriptychPart::Panel {
                left,
                right,
                text,
                caption,
            });
        }
        return SeriesTree::Triptych(parts);
    }

    if has_text || layout == SeriesLayout::Flow {
        return SeriesTree::Flow(
            raw.into_iter()
                .map(|r| match r {
                    Raw::Media(m) => FlowPart::Media(m),
                    Raw::Text(t) => FlowPart::Text(md::parse(&t)),
                })
                .collect(),
        );
    }

    let items = raw
        .into_iter()
        .filter_map(|r| match r {
            Raw::Media(m) => Some(m),
            Raw::Text(_) => None,
        })
        .collect();
    SeriesTree::Grid(group_captures(items, media))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn meta(mime: &str) -> Media {
        Media {
            mime: mime.into(),
            ..Default::default()
        }
    }

    #[test]
    fn grid_pairs_live_tiles() {
        let mut media = HashMap::new();
        media.insert("a".to_string(), meta("image/jpeg"));
        media.insert("b".to_string(), meta("video/quicktime"));
        media.insert("c".to_string(), meta("image/jpeg"));
        media.insert("d".to_string(), meta("video/mp4"));
        let body = "![one](blob://a)\n\n![](blob://b)\n\n![three](blob://c)\n\n![](blob://d)\n\n![](blob://d)";
        let SeriesTree::Grid(caps) = build("x", SeriesLayout::Grid, body, &media) else {
            panic!()
        };
        assert_eq!(caps.len(), 3);
        assert!(matches!(&caps[0], Capture::Live { still, .. } if still.alt == "one"));
        assert!(matches!(&caps[1], Capture::Live { .. }));
        assert!(matches!(&caps[2], Capture::Video(_)));
    }

    #[test]
    fn flow_when_text() {
        let body = "Some words.\n\n![](blob://a)\n\nMore *words*.";
        let SeriesTree::Flow(parts) = build("x", SeriesLayout::Grid, body, &HashMap::new()) else {
            panic!()
        };
        assert_eq!(parts.len(), 3);
        assert!(matches!(&parts[1], FlowPart::Media(_)));
    }

    #[test]
    fn phosphene_triptych() {
        let md = include_str!("fixtures/real-phosphene.md");
        // the twin inlines the series after the prose; take from the first image on
        let start = md.find("![](https://blobs").unwrap();
        let end = md.find("\n---\n\n## Related").unwrap();
        let tree = build(
            "phosphene",
            SeriesLayout::Grid,
            &md[start..end],
            &HashMap::new(),
        );
        let SeriesTree::Triptych(parts) = tree else {
            panic!()
        };
        assert_eq!(parts.len(), 6);
        let TriptychPart::Panel {
            left,
            right,
            text,
            caption,
        } = &parts[0]
        else {
            panic!()
        };
        assert!(left.src.cid().unwrap().starts_with("bafkreifvg"));
        assert!(right.is_some());
        assert!(caption.is_empty());
        assert_eq!(text.len(), 1);
        let Block::Para(lines) = &text[0].lines[0] else {
            panic!()
        };
        assert!(lines.text.starts_with(
            "The high pines drag their needles across a sharp blue sky.\nIn the clearing"
        ));
        assert!(
            text[0]
                .note
                .as_ref()
                .unwrap()
                .text
                .starts_with("clear daylight from the west")
        );
        assert!(
            parts
                .iter()
                .all(|p| matches!(p, TriptychPart::Panel { right: Some(_), .. }))
        );
    }
}
