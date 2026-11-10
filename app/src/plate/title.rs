use crate::api::Index;

#[derive(Clone, Debug, PartialEq)]
pub struct Title {
    pub label: String,
    pub href: Option<String>,
    pub mark: Mark,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Mark {
    Ink,
    Section(u8),
    Heading,
}

impl Mark {
    pub fn of_section(slug: &str) -> Mark {
        match crate::theme::section_hue(slug) {
            0 => Mark::Ink,
            hue => Mark::Section(hue),
        }
    }

    pub(super) fn code(self) -> u8 {
        match self {
            Mark::Ink => 0,
            Mark::Section(hue) => hue.min(5) * 40,
            Mark::Heading => 255,
        }
    }
}

impl Title {
    pub fn for_page(payload: &crate::api::RoutePayload) -> Vec<Title> {
        use crate::api::RoutePayload as P;
        use Mark::{Heading, Ink};
        let t = |label: &str, href: Option<String>, mark: Mark| Title {
            label: label.to_string(),
            href,
            mark,
        };
        let name = payload.name().unwrap_or_default();
        let named = |href: Option<String>| t(name, href, Heading);
        let date = |d: &Option<String>| d.as_deref().map(|d| d.get(..10).unwrap_or(d).to_string());
        let mut out = Vec::new();
        match payload {
            P::Doc { doc } => {
                out.push(t(
                    &doc.section.name,
                    Some(format!("/{}", doc.section.slug)),
                    Heading,
                ));
                out.push(t(name, Some(doc.href.clone()), Ink));
                if let Some(d) = date(&doc.published_at) {
                    out.push(t(&d, None, Ink));
                }
                for (name, r) in [("Previous", &doc.prev), ("Next", &doc.next)] {
                    if let Some(r) = r {
                        out.push(t(name, None, Heading));
                        out.push(t(&r.title, Some(r.href.clone()), Ink));
                    }
                }
                if !doc.related.is_empty() {
                    out.push(t("Related", None, Heading));
                    out.extend(
                        doc.related
                            .iter()
                            .map(|r| t(&r.title, Some(r.href.clone()), Ink)),
                    );
                }
            }
            P::List { section, items, .. } => {
                out.push(named(Some(format!("/{}", section.slug))));
                out.extend(items.iter().map(|i| t(&i.title, Some(i.href.clone()), Ink)));
            }
            P::Tag { tag, items, .. } => {
                out.push(named(Some(format!(
                    "/tags/{}",
                    crate::content::encode_segment(tag)
                ))));
                out.extend(items.iter().map(|i| t(&i.title, Some(i.href.clone()), Ink)));
            }
            P::Content { items, .. } => {
                out.push(named(Some("/content".into())));
                out.extend(items.iter().map(|i| t(&i.title, Some(i.href.clone()), Ink)));
            }
            P::Tags { tags, .. } => {
                out.push(named(Some("/tags".into())));
                out.extend(tags.iter().map(|x| {
                    t(
                        &x.tag,
                        Some(format!("/tags/{}", crate::content::encode_segment(&x.tag))),
                        Ink,
                    )
                }));
            }
            P::Feed { .. } | P::Post { .. } => out.push(named(Some("/feed".into()))),
            P::Page { slug, .. } => out.push(named(Some(format!("/{slug}")))),
            P::Now(_) => out.push(named(Some("/now".into()))),
            P::Resume { .. } => out.push(named(Some("/resume".into()))),
            P::Developers(_) => out.push(named(Some("/developers".into()))),
            P::NotFound => out.push(named(None)),
            P::Home | P::Redirect { .. } => {}
        }
        out.push(t("iammatthias.com", Some("/".into()), Ink));
        out
    }

    pub fn from_index_in(index: &Index, only: Option<&str>) -> Vec<Title> {
        let mut items: Vec<_> = index
            .items
            .iter()
            .filter(|i| only.is_none_or(|o| o == i.section))
            .collect();
        items.sort_by(|a, b| b.published_at.cmp(&a.published_at));
        let mut out = Vec::new();
        if let Some(section) = only.and_then(|o| index.sections.iter().find(|s| s.slug == o)) {
            out.push(Title {
                label: section.name.clone(),
                href: Some(format!("/{}", section.slug)),
                mark: Mark::Heading,
            });
        }
        let mut year = String::new();
        for i in items {
            let y = i
                .published_at
                .as_deref()
                .and_then(|d| d.get(..4))
                .unwrap_or("");
            if !y.is_empty() && y != year {
                year = y.to_string();
                out.push(Title {
                    label: year.clone(),
                    href: None,
                    mark: Mark::Heading,
                });
            }
            out.push(Title {
                label: i.title.clone(),
                href: Some(i.href.clone()),
                mark: Mark::of_section(&i.section),
            });
        }
        if only.is_none() && !index.elsewhere.is_empty() {
            out.push(Title {
                label: "Elsewhere".into(),
                href: None,
                mark: Mark::Heading,
            });
            let mark = Mark::of_section("elsewhere");
            out.extend(index.elsewhere.iter().map(|l| Title {
                label: l.label.clone(),
                href: Some(l.href.clone()),
                mark,
            }));
        }
        out
    }
}
