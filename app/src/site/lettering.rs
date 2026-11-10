use crate::api::{Index, TimelineItem};
use crate::home::{self, Home};
use crate::plate::{Mark, Title};
use crate::route::Route;

pub enum Lettering {
    Page(Vec<Title>),
    Timeline(Vec<Title>),
    Index(Vec<Title>),
    Wait,
}

impl Lettering {
    pub fn into_titles(self, on_home: bool) -> Option<(Vec<Title>, bool)> {
        match self {
            Lettering::Timeline(t) => Some((t, on_home)),
            Lettering::Page(t) | Lettering::Index(t) => Some((t, false)),
            Lettering::Wait => None,
        }
    }
}

pub struct Sources<'a> {
    pub route: &'a Route,
    pub page: Option<&'a [Title]>,
    pub home: &'a Home,
    pub timeline: &'a [TimelineItem],
    pub timeline_waiting: bool,
    pub index: Option<&'a Index>,
}

pub fn lettering(s: &Sources) -> Lettering {
    let narrowed = s.home.narrowed();
    if let (Route::Other(_), Some(page)) = (s.route, s.page) {
        return Lettering::Page(page.to_vec());
    }
    if !narrowed && !s.timeline.is_empty() {
        return Lettering::Timeline(timeline_titles(s.timeline));
    }
    if *s.route == Route::Home && !narrowed && s.timeline_waiting {
        return Lettering::Wait;
    }
    let Some(index) = s.index else {
        return Lettering::Wait;
    };
    let all = Title::from_index_in(index, s.home.section.as_deref());
    let q = s.home.query.trim().to_lowercase();
    Lettering::Index(if q.is_empty() {
        all
    } else {
        filter_titles(all, index, &q)
    })
}

fn timeline_titles(timeline: &[TimelineItem]) -> Vec<Title> {
    let mut out = Vec::with_capacity(timeline.len() + 8);
    let mut year = "";
    for it in timeline {
        let y = it.at.get(..4).unwrap_or("");
        if !y.is_empty() && y != year {
            year = y;
            out.push(Title {
                label: y.to_string(),
                href: None,
                mark: Mark::Heading,
            });
        }
        out.push(Title {
            label: it.title.clone(),
            href: Some(it.href.clone()),
            mark: Mark::of_section(&it.kind),
        });
    }
    out
}

fn filter_titles(all: Vec<Title>, index: &Index, q: &str) -> Vec<Title> {
    let hits: std::collections::HashSet<&str> = index
        .items
        .iter()
        .filter(|i| home::matches_query(i, q))
        .map(|i| i.href.as_str())
        .collect();
    let mut out: Vec<Title> = Vec::new();
    let mut head: Option<Title> = None;
    for t in all {
        if t.mark == Mark::Heading {
            head = Some(t);
        } else if t.href.as_deref().is_some_and(|h| hits.contains(h)) {
            if let Some(h) = head.take() {
                out.push(h);
            }
            out.push(t);
        }
    }
    if out.is_empty() {
        out.push(Title {
            label: format!("Nothing matches {q}"),
            href: None,
            mark: Mark::Ink,
        });
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn index() -> Index {
        let mut index: Index = serde_json::from_str(
            r#"{"items": [
                {"title": "Glass", "href": "/posts/glass", "section": "posts", "publishedAt": "2024-05-01", "tags": ["Photography"]},
                {"title": "Pizza Dough", "href": "/recipes/dough", "section": "recipes", "publishedAt": "2023-02-01"}
            ], "elsewhere": [{"label": "GitHub", "href": "https://github.com/iammatthias"}]}"#,
        )
        .unwrap();
        index.prepare_search();
        index
    }

    fn labels(titles: Vec<Title>) -> Vec<String> {
        titles.into_iter().map(|t| t.label).collect()
    }

    #[test]
    fn search_narrows_the_spiral() {
        let index = index();
        let narrowed =
            |q: &str| labels(filter_titles(Title::from_index_in(&index, None), &index, q));
        assert_eq!(narrowed("photo"), ["2024", "Glass"]);
        assert_eq!(narrowed("dough"), ["2023", "Pizza Dough"]);
        assert_eq!(narrowed("github"), ["Nothing matches github"]);
    }

    #[test]
    fn a_search_letters_the_spiral_with_its_matches() {
        let index = index();
        let timeline = [TimelineItem {
            title: "Pizza Dough".into(),
            href: "/recipes/dough".into(),
            kind: "recipes".into(),
            at: "2023-02-01".into(),
        }];
        let home = Home {
            query: "photo ".into(),
            ..Default::default()
        };
        let sources = Sources {
            route: &Route::Home,
            page: None,
            home: &home,
            timeline: &timeline,
            timeline_waiting: false,
            index: Some(&index),
        };
        let Lettering::Index(titles) = lettering(&sources) else {
            panic!("a search letters from the index")
        };
        assert_eq!(labels(titles), ["2024", "Glass"]);
    }
}
