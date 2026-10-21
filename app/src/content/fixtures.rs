//! Dev fixtures: hand-written constructs plus real `.md` twins from iammatthias.com, turned
//! into route payloads (`payload("doc")` etc.; see `NAMES`), built only for the tests, which
//! check that every one builds and that the Worker's own fixtures parse.

use std::collections::HashMap;

use serde::Deserialize;

use crate::api::{
    Doc, Item, Media, Paging, Post, RelatedRef, RoutePayload, SectionRef, Series, SeriesLayout,
    TagCount,
};

const CONSTRUCTS: &str = include_str!("fixtures/constructs.md");
const SERIES_GRID: &str = include_str!("fixtures/series-grid.md");
const PIZZA: &str = include_str!("fixtures/real-pizza-dough.md");
const PEPPERCORN: &str = include_str!("fixtures/real-peppercorn.md");
const PHOSPHENE: &str = include_str!("fixtures/real-phosphene.md");
const COGNITION: &str = include_str!("fixtures/real-own-the-means-of-cognition.md");

#[allow(dead_code)]
pub const NAMES: &[&str] = &[
    "constructs",
    "recipe",
    "peppercorn",
    "phosphene",
    "essay",
    "series",
    "list",
    "content",
    "tag",
    "tags",
    "feed",
    "post",
    "page",
    "notfound",
];

/// Real image sizes for the blobs the twins reference (read from their PNG headers).
const DIMS: &[(&str, u32, u32)] = &[
    (
        "bafkreiavvwfjgkzycmpjq7nwy4k6emexihbans65nu7reveu5hk2but2im",
        1024,
        576,
    ),
    (
        "bafkreicjmwp3zj3nogwn4fsqvwrzwb7yuv4vzjari5qhp3usw3rxkx336m",
        768,
        432,
    ),
    (
        "bafkreicu6lvobh6f5pbw7dcgf5fsrqy4xxwvq6m2ab67fzmnc6cfloogni",
        1024,
        576,
    ),
    (
        "bafkreid7esenmjqjofgcodod5oise3vzyar3p2xkya323cftwr4ofjcfzm",
        1024,
        576,
    ),
    (
        "bafkreieggiahbvscnckpzib7jnsd4qmrtwclphubav2ugoj6x6ydm7fbpm",
        1672,
        941,
    ),
    (
        "bafkreif2rojumsxo4kpvupdn4u7bvefs6ls6qplctur62ipxnybl24byhu",
        1024,
        576,
    ),
    (
        "bafkreif73dkmdi653kp5x7kqt6o2brm4kuososfw4gb4ezmr6mi5krpbbe",
        768,
        432,
    ),
    (
        "bafkreifvgfs3s3nac4nfgmplagbhud2yzauj5gvfdpwr4wgmducn6xcouq",
        768,
        432,
    ),
    (
        "bafkreig3oxahwoifgz453lsnc6yohkpqdryuxvhjun2sse7qpexyutpzm4",
        768,
        432,
    ),
    (
        "bafkreighxiv55r3i4n4yxk7isyanpvnc42hi5u7lrzlf3aptflb2q74kym",
        2048,
        2048,
    ),
    (
        "bafkreigltiscc2ltcwa6xvdyashfc3kxibt5pqj6vo6tazauhepg3vhnsy",
        768,
        432,
    ),
    (
        "bafkreihc3rmvvenpg57atlwq366uqcdoqqajcooj5ezffnnxq4gaxhuh3q",
        768,
        768,
    ),
    (
        "bafkreihyqwif4bqvvc745rckfufwinv3kz2avjusommiced3vtlhsmvumm",
        1024,
        576,
    ),
];

const BLOBS: &str = "https://blobs.farfield.systems/blobs/";

fn media_map() -> HashMap<String, Media> {
    let mut m: HashMap<String, Media> = DIMS
        .iter()
        .map(|(cid, w, h)| {
            (
                cid.to_string(),
                Media {
                    mime: "image/png".into(),
                    width: Some(*w),
                    height: Some(*h),
                    ..Default::default()
                },
            )
        })
        .collect();
    m.insert(
        "bafkreiplaceholdercid".into(),
        Media {
            mime: "image/jpeg".into(),
            width: Some(1600),
            height: Some(1067),
            dominant_color: Some("#7a8a6e".into()),
            ..Default::default()
        },
    );
    m.insert(
        "bafkreivideocid".into(),
        Media {
            mime: "video/mp4".into(),
            width: Some(1920),
            height: Some(1080),
            dominant_color: Some("#3d5566".into()),
            thumb_cid: Some("bafkreiplaceholdercid".into()),
            ..Default::default()
        },
    );
    m.insert(
        "bafkreimotioncid".into(),
        Media {
            mime: "video/quicktime".into(),
            width: Some(1024),
            height: Some(576),
            ..Default::default()
        },
    );
    m
}

#[derive(Default, Deserialize)]
#[serde(default)]
struct Front {
    title: String,
    section: String,
    description: Option<String>,
    tags: Vec<String>,
    published: Option<String>,
    updated: Option<String>,
    cid: String,
    html: String,
}

/// A `.md` twin → (front matter, body without the repeated title or the Related appendix, related).
fn twin(md: &str) -> (Front, String, Vec<RelatedRef>) {
    let mut front = Front::default();
    let mut body = md;
    if let Some(rest) = md.strip_prefix("---\n") {
        if let Some(end) = rest.find("\n---\n") {
            front = serde_yaml::from_str(&rest[..end]).unwrap_or_default();
            body = &rest[end + 5..];
        }
    }
    let mut related = Vec::new();
    let body = match body.find("\n---\n\n## Related") {
        Some(at) => {
            for line in body[at..].lines() {
                let Some(rest) = line.strip_prefix("- [") else {
                    continue;
                };
                let Some((title, rest)) = rest.split_once("](") else {
                    continue;
                };
                let Some((url, _)) = rest.split_once(')') else {
                    continue;
                };
                let href = url
                    .trim_end_matches(".md")
                    .replace("https://iammatthias.com", "");
                let section = href.split('/').nth(1).map(str::to_string);
                related.push(RelatedRef {
                    title: title.to_string(),
                    href,
                    section,
                    ..Default::default()
                });
            }
            &body[..at]
        }
        None => body,
    };
    (front, body.trim().to_string(), related)
}

fn doc_from(md: &str, media: HashMap<String, Media>) -> Doc {
    let (f, body, related) = twin(md);
    let href = f.html.replace("https://iammatthias.com", "");
    let mut name = f.section.clone();
    if let Some(c) = name.get_mut(..1) {
        c.make_ascii_uppercase();
    }
    let rkey = href.rsplit('/').next().unwrap_or("").to_string();
    Doc {
        title: f.title,
        section: SectionRef {
            slug: f.section,
            name,
            ..Default::default()
        },
        rkey,
        cid: f.cid,
        href,
        published_at: f.published,
        updated_at: f.updated,
        tags: f.tags,
        description: f.description,
        reading_minutes: None,
        markdown: body,
        media,
        series: HashMap::new(),
        related,
        prev: Some(RelatedRef {
            title: "Pizza Sauce".into(),
            href: "/recipes/1710031949965-pizza-sauce".into(),
            section: None,
            ..Default::default()
        }),
        next: Some(RelatedRef {
            title: "Pizza Margherita".into(),
            href: "/recipes/1710032637430-pizza-margherita".into(),
            section: None,
            ..Default::default()
        }),
    }
}

/// Split a blob-URL body into blocks and swap the series body in behind `series://slug`.
fn with_series(mut doc: Doc, slug: &str, layout: SeriesLayout) -> Doc {
    let start = doc
        .markdown
        .find(&format!("![]({BLOBS}"))
        .unwrap_or(doc.markdown.len());
    let series_body = doc.markdown[start..].to_string();
    doc.markdown = format!(
        "{}\n\n![](series://{slug})\n",
        doc.markdown[..start].trim_end()
    );
    doc.series.insert(
        slug.to_string(),
        Series {
            title: None,
            body: series_body,
            layout,
        },
    );
    doc
}

fn items() -> Vec<Item> {
    let mk =
        |title: &str, href: &str, section: &str, date: &str, excerpt: &str, tags: &[&str]| Item {
            title: title.into(),
            href: href.into(),
            section: section.into(),
            published_at: Some(date.into()),
            excerpt: Some(excerpt.into()),
            tags: tags.iter().map(|t| t.to_string()).collect(),
            cid: None,
            lower: None,
        };
    vec![
        mk(
            "Own The Means of Cognition",
            "/posts/1789494942000-own-the-means-of-cognition",
            "posts",
            "2026-10-02T02:01:14Z",
            "Own the means of cognition and you don't need a ministry of truth, the modal in everyone's pocket does the job.",
            &["llms", "commons"],
        ),
        mk(
            "Phosphene",
            "/art/1781816428977-phosphene",
            "art",
            "2026-06-18T21:00:28Z",
            "A camera that turns each photo into a poem, then paints a new image from those words.",
            &["ai", "photography"],
        ),
        mk(
            "Neopolitan Pizza Dough",
            "/recipes/1710031406664-pizza-dough",
            "recipes",
            "2024-03-09T16:43:00Z",
            "Classic Neapolitan pizza dough recipe using 00 and all-purpose flours.",
            &["pizza", "baking"],
        ),
        mk(
            "Brandy Peppercorn Sauce (two ways)",
            "/recipes/1766509866956-brandy-peppercorn-sauce-two-ways",
            "recipes",
            "2025-12-23T17:11:06Z",
            "Versatile peppercorn sauce recipe with classic and dairy-free/wheat-free options. Rich, creamy base with brandy and crushed peppercorns.",
            &["sauce"],
        ),
        mk(
            "Datamosh",
            "/art/1791519648658-datamosh",
            "art",
            "2026-10-11T12:00:00Z",
            "An iOS app",
            &["ios"],
        ),
    ]
}

fn posts(media: &HashMap<String, Media>) -> Vec<Post> {
    let p = |rkey: &str, at: &str, body: String| Post {
        rkey: rkey.into(),
        cid: String::new(),
        updated_at: None,
        href: format!("/feed/{rkey}"),
        body,
        created_at: at.into(),
        tags: vec!["notes".into(), "plates".into()],
        media: media.clone(),
        series: HashMap::new(),
    };
    vec![
        p(
            "3m2abc",
            "2026-10-11T19:20:00Z",
            "Pulled the first proof off the new plate tonight. The burin line holds at every scale, which is the whole trick.".into(),
        ),
        p(
            "3m2abd",
            "2026-10-09T08:05:00Z",
            format!(
                "Morning at the lake. *Overcast, heavy grey sky*, and the pines refusing the bribe.\n\n![]({BLOBS}bafkreif2rojumsxo4kpvupdn4u7bvefs6ls6qplctur62ipxnybl24byhu)\n\n![]({BLOBS}bafkreigltiscc2ltcwa6xvdyashfc3kxibt5pqj6vo6tazauhepg3vhnsy)\n\n![]({BLOBS}bafkreihc3rmvvenpg57atlwq366uqcdoqqajcooj5ezffnnxq4gaxhuh3q)"
            ),
        ),
        p(
            "3m2abe",
            "2026-10-02T02:10:00Z",
            format!(
                "New essay: [Own The Means of Cognition](/posts/1789494942000-own-the-means-of-cognition). Fences, commons, and the modal in everyone's pocket.\n\n![]({BLOBS}bafkreieggiahbvscnckpzib7jnsd4qmrtwclphubav2ugoj6x6ydm7fbpm)"
            ),
        ),
    ]
}

pub fn payload(name: &str) -> Option<RoutePayload> {
    let media = media_map();
    Some(match name {
        "constructs" | "doc" => {
            let mut doc = doc_from(COGNITION, media);
            doc.title = "A Specimen of the Renderer".into();
            doc.section = SectionRef { slug: "posts".into(), name: "Posts".into(), ..Default::default() };
            doc.tags = vec!["specimen".into(), "typography".into(), "gpui".into()];
            doc.markdown = CONSTRUCTS.to_string();
            doc.href = "/posts/specimen".into();
            RoutePayload::Doc { doc }
        }
        "recipe" => RoutePayload::Doc { doc: doc_from(PIZZA, media) },
        "peppercorn" => RoutePayload::Doc { doc: doc_from(PEPPERCORN, media) },
        "phosphene" => {
            let doc = doc_from(PHOSPHENE, media);
            RoutePayload::Doc { doc: with_series(doc, "phosphene", SeriesLayout::Triptych) }
        }
        "essay" => RoutePayload::Doc { doc: doc_from(COGNITION, media) },
        "series" => {
            let mut doc = doc_from(COGNITION, media);
            doc.title = "Series, Two Ways".into();
            doc.section = SectionRef { slug: "art".into(), name: "Art".into(), ..Default::default() };
            doc.markdown = SERIES_GRID.to_string();
            let grid = [
                "bafkreif2rojumsxo4kpvupdn4u7bvefs6ls6qplctur62ipxnybl24byhu",
                "bafkreimotioncid",
                "bafkreigltiscc2ltcwa6xvdyashfc3kxibt5pqj6vo6tazauhepg3vhnsy",
                "bafkreihc3rmvvenpg57atlwq366uqcdoqqajcooj5ezffnnxq4gaxhuh3q",
                "bafkreighxiv55r3i4n4yxk7isyanpvnc42hi5u7lrzlf3aptflb2q74kym",
                "bafkreicu6lvobh6f5pbw7dcgf5fsrqy4xxwvq6m2ab67fzmnc6cfloogni",
            ];
            let body = grid
                .iter()
                .map(|c| if c.starts_with("bafkreimotion") { format!("![](blob://{c})") } else { format!("![]({BLOBS}{c})") })
                .collect::<Vec<_>>()
                .join("\n\n");
            doc.series.insert("pines".into(), Series { title: None, body, layout: SeriesLayout::Grid });
            doc.series.insert(
                "flow".into(),
                Series {
                    title: None,
                    body: format!(
                        "The road paints its white panic on the asphalt.\n\n![A stop line]({BLOBS}bafkreicu6lvobh6f5pbw7dcgf5fsrqy4xxwvq6m2ab67fzmnc6cfloogni)\n\nAnd *the deep mountain water* gave a damn where our pavement ends."
                    ),
                    layout: SeriesLayout::Flow,
                },
            );
            RoutePayload::Doc { doc }
        }
        "list" => RoutePayload::List {
            section: SectionRef { slug: "recipes".into(), name: "Recipes".into(), ..Default::default() },
            paging: Paging { page: 2, pages: 4, total: 0 },
            items: items(),
        },
        "content" => RoutePayload::Content { paging: Paging { page: 1, pages: 9, total: 105 }, items: items(), sections: Vec::new() },
        "tag" => RoutePayload::Tag { tag: "photography".into(), paging: Paging { page: 1, pages: 1, total: 0 }, items: items() },
        "tags" => RoutePayload::Tags {
            tags: [
                ("photography", 48),
                ("recipe", 41),
                ("ai", 22),
                ("generative", 19),
                ("cloudflare", 12),
                ("atproto", 9),
                ("pizza", 6),
                ("baking", 14),
                ("ios", 5),
                ("open-weights", 2),
                ("commons", 3),
                ("film", 27),
                ("neapolitan", 1),
                ("rust", 7),
            ]
            .iter()
            .map(|(t, c)| TagCount { tag: t.to_string(), count: *c })
            .collect(),
        },
        "feed" => RoutePayload::Feed { paging: Paging { page: 1, pages: 12, total: 140 }, posts: posts(&media) },
        "post" => RoutePayload::Post { post: posts(&media).remove(1) },
        "page" => RoutePayload::Page {
            slug: "now".into(),
            title: "Now".into(),
            markdown: "What I am doing lately, in no particular order.\n\n## Making\n\n- Engraving a website onto a copper plate, more or less\n- Proofing pizza dough at two hydrations\n\n## Reading\n\n> The line is the thing. — *a printer's proverb*\n\nUpdated in October.".into(),
        },
        "notfound" => RoutePayload::NotFound,
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::content::md::{self, Block};

    #[test]
    fn every_fixture_builds() {
        for n in NAMES {
            assert!(payload(n).is_some(), "{n}");
        }
    }

    #[test]
    fn twins_strip_front_matter_and_related() {
        let (f, body, related) = twin(COGNITION);
        assert_eq!(f.title, "Own The Means of Cognition");
        assert!(body.starts_with("# Own The Means"));
        assert!(!body.contains("## Related"));
        assert_eq!(related.len(), 6);
        assert!(related[0].href.starts_with("/art/"));
    }

    #[test]
    fn constructs_cover_everything() {
        let blocks = md::parse(CONSTRUCTS);
        let has = |f: &dyn Fn(&Block) -> bool| blocks.iter().any(f);
        assert!(has(&|b| matches!(b, Block::Callout { .. })));
        assert!(has(&|b| matches!(b, Block::Table { .. })));
        assert!(has(&|b| matches!(b, Block::Mermaid(_))));
        assert!(has(&|b| matches!(b, Block::Reveal { .. })));
        assert!(has(
            &|b| matches!(b, Block::Embed { name, .. } if name == "ff-tuner")
        ));
        assert!(has(&|b| matches!(b, Block::Nothing)));
        assert!(has(&|b| matches!(b, Block::UnknownComponent(_))));
        assert!(has(&|b| matches!(b, Block::Footnotes(_))));
        assert_eq!(
            blocks
                .iter()
                .filter(|b| matches!(b, Block::Figure(_)))
                .count(),
            3
        );
    }

    /// The Worker's recorded payloads deserialize and parse without panicking.
    #[test]
    fn worker_fixtures_parse() {
        let dir =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../worker/fixtures/app-api");
        let Ok(entries) = std::fs::read_dir(&dir) else {
            return;
        };
        let mut n = 0;
        for e in entries.flatten() {
            let path = e.path();
            if path.extension().is_none_or(|x| x != "json") {
                continue;
            }
            let bytes = std::fs::read(&path).unwrap();
            let Ok(payload) = serde_json::from_slice::<RoutePayload>(&bytes) else {
                continue;
            };
            n += 1;
            match payload {
                RoutePayload::Doc { doc } => {
                    let p = crate::content::cache::parsed(
                        Some(&doc.cid),
                        &doc.markdown,
                        &doc.media,
                        &doc.series,
                    );
                    assert!(!p.blocks.is_empty(), "{path:?}");
                }
                RoutePayload::Feed { posts, .. } => {
                    for post in posts {
                        crate::content::cache::parsed(None, &post.body, &post.media, &post.series);
                    }
                }
                RoutePayload::Page { markdown, .. } => {
                    md::parse(&markdown);
                }
                _ => {}
            }
        }
        assert!(n > 5, "only {n} payloads parsed from {dir:?}");
    }

    #[test]
    fn phosphene_fixture_has_a_triptych() {
        let Some(RoutePayload::Doc { doc }) = payload("phosphene") else {
            panic!()
        };
        assert!(doc.markdown.trim_end().ends_with("![](series://phosphene)"));
        assert!(doc.series["phosphene"].body.starts_with("![](https://"));
    }
}
