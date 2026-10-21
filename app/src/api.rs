//! The app's read-only data contract with the `com` Worker: `/api/app/index` and
//! `/api/app/route?path=`. Mirrors `worker/src/app-api.ts`; fields the Worker may
//! omit default rather than fail, so a slightly older or newer Worker still loads.

use std::collections::HashMap;

use serde::Deserialize;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Index {
    pub sections: Vec<Section>,
    pub items: Vec<Item>,
    pub feed: Vec<FeedRef>,
    pub elsewhere: Vec<Link>,
    /// @com's site menu, grouped as its /menu page shows it
    pub menu: Vec<MenuGroup>,
    /// the three newest feed posts, whole, for the home deck's feed column
    pub latest_feed: Vec<Post>,
    /// the home deck's hero photograph, from Glass
    pub glass_pick: Option<GlassPick>,
    /// the home deck's introduction, markdown
    pub intro: String,
}

/// GET /api/app/timeline?page=N: every document and feed note, newest first.
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Timeline {
    pub items: Vec<TimelineItem>,
    pub page: u32,
    pub pages: u32,
    pub total: u32,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct TimelineItem {
    pub title: String,
    pub href: String,
    /// the publication's slug, or "feed"
    pub kind: String,
    pub at: String,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct MenuGroup {
    pub group: String,
    pub links: Vec<Link>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct GlassPick {
    pub href: String,
    pub image: String,
    pub width: Option<f32>,
    pub height: Option<f32>,
    #[serde(rename = "prominentColor")]
    pub prominent_color: Option<String>,
    pub caption: GlassCaption,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct GlassCaption {
    pub title: Option<String>,
    pub series: Option<String>,
    pub equipment: Option<String>,
    pub settings: Option<String>,
    pub date: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Section {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub count: u32,
}

/// One published document as it appears in listings and on the spiral.
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Item {
    pub title: String,
    pub href: String,
    pub section: String,
    pub published_at: Option<String>,
    pub excerpt: Option<String>,
    pub tags: Vec<String>,
    pub cid: Option<String>,
    /// the title and tags lowercased, made once when the index arrives (Find matches every frame)
    #[serde(skip)]
    pub lower: Option<(String, Vec<String>)>,
}

impl Index {
    /// Lowercase every item's title and tags ahead of searching them.
    pub fn prepare_search(&mut self) {
        for i in &mut self.items {
            i.lower = Some((
                i.title.to_lowercase(),
                i.tags.iter().map(|t| t.to_lowercase()).collect(),
            ));
        }
    }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct FeedRef {
    pub rkey: String,
    pub href: String,
    pub excerpt: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Link {
    pub label: String,
    pub href: String,
    /// a handle shown beside the name (Now's "Find me")
    pub username: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SectionRef {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub count: u32,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Media {
    pub mime: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub dominant_color: Option<String>,
    pub blurhash: Option<String>,
    pub thumb_cid: Option<String>,
}

impl Media {
    pub fn aspect(&self) -> f32 {
        match (self.width, self.height) {
            (Some(w), Some(h)) if w > 0 && h > 0 => w as f32 / h as f32,
            _ => 4.0 / 3.0,
        }
    }

    pub fn is_video(&self) -> bool {
        self.mime.starts_with("video/")
    }

    pub fn is_audio(&self) -> bool {
        self.mime.starts_with("audio/")
    }

    /// A still image wsrv.nl can resize: not a vector, and not a GIF, which would stop moving.
    pub fn is_raster(&self) -> bool {
        self.mime.starts_with("image/") && self.mime != "image/svg+xml" && self.mime != "image/gif"
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SeriesLayout {
    #[default]
    Grid,
    Flow,
    Triptych,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Series {
    pub title: Option<String>,
    pub body: String,
    pub layout: SeriesLayout,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Doc {
    pub title: String,
    pub section: SectionRef,
    pub rkey: String,
    pub cid: String,
    pub href: String,
    pub published_at: Option<String>,
    pub updated_at: Option<String>,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub reading_minutes: Option<u32>,
    /// raw body markdown as stored: `<ff-*>` tags, `blob://`, `series://`, ```recipe fences
    pub markdown: String,
    pub media: HashMap<String, Media>,
    pub series: HashMap<String, Series>,
    pub related: Vec<RelatedRef>,
    pub prev: Option<RelatedRef>,
    pub next: Option<RelatedRef>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
#[serde(rename_all = "camelCase")]
pub struct RelatedRef {
    pub title: String,
    pub href: String,
    pub section: Option<String>,
    pub description: Option<String>,
    pub published_at: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Post {
    pub rkey: String,
    pub cid: String,
    pub href: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub tags: Vec<String>,
    pub media: HashMap<String, Media>,
    pub series: HashMap<String, Series>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct TagCount {
    pub tag: String,
    pub count: u32,
}

/// Where a paged listing stands: this page (1-based), how many there are, how many entries in
/// all (a section's listing leaves it out).
#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq)]
#[serde(default)]
pub struct Paging {
    pub page: u32,
    pub pages: u32,
    pub total: u32,
}

/// Everything one URL needs, discriminated on `kind`.
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum RoutePayload {
    Home,
    Doc {
        doc: Doc,
    },
    List {
        section: SectionRef,
        #[serde(flatten)]
        paging: Paging,
        #[serde(default)]
        items: Vec<Item>,
    },
    Content {
        #[serde(flatten)]
        paging: Paging,
        #[serde(default)]
        items: Vec<Item>,
        #[serde(default)]
        sections: Vec<Section>,
    },
    Feed {
        #[serde(flatten)]
        paging: Paging,
        #[serde(default)]
        posts: Vec<Post>,
    },
    Post {
        post: Post,
    },
    Tags {
        #[serde(default)]
        tags: Vec<TagCount>,
    },
    Tag {
        tag: String,
        #[serde(flatten)]
        paging: Paging,
        #[serde(default)]
        items: Vec<Item>,
    },
    Now(Box<Now>),
    Resume {
        #[serde(default)]
        title: String,
        #[serde(default)]
        sections: Vec<ResumeSection>,
    },
    Developers(Box<Developers>),
    Page {
        slug: String,
        #[serde(default)]
        title: String,
        #[serde(default)]
        markdown: String,
    },
    Redirect {
        to: String,
    },
    #[serde(other)]
    NotFound,
}

impl RoutePayload {
    /// What the page is called: the document title and the frame's heading are made from it.
    /// None for home and a redirect, which have no page of their own.
    pub fn name(&self) -> Option<&str> {
        Some(match self {
            RoutePayload::Doc { doc } => &doc.title,
            RoutePayload::Page { title, .. } => title,
            RoutePayload::List { section, .. } => &section.name,
            RoutePayload::Tag { tag, .. } => tag,
            RoutePayload::Tags { .. } => "Tags",
            RoutePayload::Feed { .. } | RoutePayload::Post { .. } => "Feed",
            RoutePayload::Content { .. } => "Content",
            RoutePayload::Now(_) => "Now",
            RoutePayload::Resume { .. } => "Resume",
            RoutePayload::Developers(_) => "Developers",
            RoutePayload::NotFound => "Not found",
            RoutePayload::Home | RoutePayload::Redirect { .. } => return None,
        })
    }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Now {
    pub title: String,
    pub bio: String,
    pub working: String,
    pub recent: Vec<Post>,
    pub find_me: Vec<Link>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct ResumeSection {
    pub title: String,
    pub entries: Vec<ResumeEntry>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct ResumeEntry {
    pub company: String,
    pub date: String,
    pub position: String,
    pub href: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Developers {
    pub title: String,
    pub lede: String,
    pub markdown_href: String,
    pub quickstart: String,
    pub endpoints: Vec<Endpoint>,
    pub sections: Vec<DevSection>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Endpoint {
    pub label: String,
    pub href: String,
    pub description: String,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct DevSection {
    pub title: String,
    pub body: String,
}

/// How rendered content asks the site to go somewhere: same-tab for our own paths,
/// a new tab for anything off-site.
pub type Navigate = std::rc::Rc<dyn Fn(String, &mut gpui::Window, &mut gpui::App)>;

const BLOBS: &str = "https://blobs.farfield.systems/blobs/";
const WSRV: &str = "https://wsrv.nl/?";

/// A still `width` wide. A raster is resized by wsrv.nl straight from the browser (it turns
/// Workers away); anything else, or what isn't known, goes through the Worker, which decides.
/// `local` is the way back when wsrv.nl doesn't answer.
pub fn img_url(cid: &str, width: u32, media: Option<&Media>) -> String {
    if !media.is_some_and(Media::is_raster) {
        return local_img_url(cid, width);
    }
    let query = form_urlencoded::Serializer::new(String::new())
        .append_pair("url", &format!("{BLOBS}{cid}"))
        .append_pair("w", &width.to_string())
        .append_pair("q", "80")
        .append_pair("output", "webp")
        .finish();
    format!("{WSRV}{query}")
}

fn local_img_url(cid: &str, width: u32) -> String {
    format!("{}/img/{cid}?w={width}", crate::route::origin())
}

/// The same image through the Worker, for a wsrv.nl URL (a blob's resize, or the home's Glass
/// photograph); None for any other URL, which has no other way to it.
pub fn local(url: &str) -> Option<String> {
    let query = url.strip_prefix(WSRV)?;
    let pairs: HashMap<String, String> = form_urlencoded::parse(query.as_bytes())
        .into_owned()
        .collect();
    let inner = pairs.get("url")?;
    if let Some(cid) = inner.strip_prefix(BLOBS) {
        let width = pairs.get("w")?.parse().ok()?;
        return Some(local_img_url(cid, width));
    }
    inner.starts_with("https://cdn.glass.photo/").then(|| {
        let src: String = form_urlencoded::byte_serialize(url.as_bytes()).collect();
        format!("{}/api/app/glass-image?src={src}", crate::route::origin())
    })
}

pub fn blob_url(cid: &str) -> String {
    format!("{}/img/{cid}", crate::route::origin())
}

#[cfg(test)]
mod tests {
    use super::{Media, Paging, RoutePayload, img_url, local};

    fn media(mime: &str) -> Media {
        Media {
            mime: mime.into(),
            width: None,
            height: None,
            dominant_color: None,
            blurhash: None,
            thumb_cid: None,
        }
    }

    #[test]
    fn a_raster_comes_from_wsrv_with_the_worker_behind_it() {
        let url = img_url("bafkabc", 960, Some(&media("image/jpeg")));
        assert_eq!(
            url,
            "https://wsrv.nl/?url=https%3A%2F%2Fblobs.farfield.systems%2Fblobs%2Fbafkabc&w=960&q=80&output=webp"
        );
        assert_eq!(
            local(&url).as_deref(),
            Some("https://iammatthias.com/img/bafkabc?w=960")
        );
    }

    #[test]
    fn what_wsrv_would_spoil_or_can_t_judge_goes_through_the_worker() {
        for m in [Some(media("image/gif")), Some(media("image/svg+xml")), None] {
            assert_eq!(
                img_url("bafkabc", 480, m.as_ref()),
                "https://iammatthias.com/img/bafkabc?w=480"
            );
        }
        assert_eq!(local("https://iammatthias.com/img/bafkabc?w=480"), None);
    }

    #[test]
    fn the_glass_photograph_falls_back_to_its_proxy() {
        let pick =
            "https://wsrv.nl/?url=https%3A%2F%2Fcdn.glass.photo%2Fa%2Fb&w=960&q=80&output=webp";
        assert_eq!(
            local(pick).as_deref(),
            Some(
                "https://iammatthias.com/api/app/glass-image?src=https%3A%2F%2Fwsrv.nl%2F%3Furl%3Dhttps%253A%252F%252Fcdn.glass.photo%252Fa%252Fb%26w%3D960%26q%3D80%26output%3Dwebp"
            )
        );
        assert_eq!(
            local("https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fa&w=960"),
            None
        );
    }

    /// `paging` is flattened into variants of an internally tagged enum: the Worker's recorded
    /// listings must still fill it.
    #[test]
    fn listings_read_their_paging() {
        let dir =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../worker/fixtures/app-api");
        let paging = |name: &str| {
            let bytes = std::fs::read(dir.join(format!("{name}.json"))).unwrap();
            match serde_json::from_slice::<RoutePayload>(&bytes).unwrap() {
                RoutePayload::List { paging, .. }
                | RoutePayload::Content { paging, .. }
                | RoutePayload::Feed { paging, .. }
                | RoutePayload::Tag { paging, .. } => paging,
                other => panic!("{name}: {other:?}"),
            }
        };
        let p = |page, pages, total| Paging { page, pages, total };
        assert_eq!(paging("list"), p(1, 5, 0));
        assert_eq!(paging("list-page-2"), p(2, 5, 0));
        assert_eq!(paging("content"), p(1, 9, 105));
        assert_eq!(paging("content-page-2"), p(2, 9, 105));
        assert_eq!(paging("feed"), p(1, 2, 24));
        assert_eq!(paging("feed-page-2"), p(2, 2, 24));
        assert_eq!(paging("tag"), p(1, 1, 1));
    }
}
