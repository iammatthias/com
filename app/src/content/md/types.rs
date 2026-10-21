//! The block tree markdown parses into.

use std::ops::Range;

use super::super::recipe::RecipeBlock;

/// Inline styling for one run of text.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Marks {
    pub em: bool,
    pub strong: bool,
    pub code: bool,
    pub strike: bool,
    /// footnote reference marker
    pub note: bool,
    /// index into `Rich::links`
    pub link: Option<u16>,
}

impl Marks {
    pub fn plain(&self) -> bool {
        *self == Marks::default()
    }
}

/// A run of styled text: one string, contiguous non-overlapping spans that cover all of it.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Rich {
    pub text: String,
    pub spans: Vec<(Range<usize>, Marks)>,
    pub links: Vec<String>,
}

impl Rich {
    pub fn plain(text: impl Into<String>) -> Self {
        let mut r = Rich::default();
        r.push(&text.into(), Marks::default());
        r
    }

    pub fn push(&mut self, s: &str, marks: Marks) {
        if s.is_empty() {
            return;
        }
        let start = self.text.len();
        self.text.push_str(s);
        let end = self.text.len();
        if let Some((last, m)) = self.spans.last_mut() {
            if *m == marks && last.end == start {
                last.end = end;
                return;
            }
        }
        self.spans.push((start..end, marks));
    }

    pub fn is_blank(&self) -> bool {
        self.text.trim().is_empty()
    }

    /// Trim leading/trailing whitespace while keeping spans aligned.
    pub fn trimmed(&self) -> Rich {
        let start = self.text.len() - self.text.trim_start().len();
        let end = self.text.trim_end().len().max(start);
        self.slice(start..end)
    }

    /// The sub-run covering `range` (byte offsets on char boundaries), links kept.
    pub fn slice(&self, range: Range<usize>) -> Rich {
        let mut out = Rich {
            links: self.links.clone(),
            ..Default::default()
        };
        for (r, m) in &self.spans {
            let s = r.start.max(range.start);
            let e = r.end.min(range.end);
            if s < e {
                out.push(&self.text[s..e], *m);
            }
        }
        out
    }

    /// True when every non-blank run is emphasised (a stanza's trailing `*note*`).
    pub fn all_em(&self) -> bool {
        !self.is_blank()
            && self
                .spans
                .iter()
                .all(|(r, m)| m.em || self.text[r.clone()].trim().is_empty())
    }

    pub fn without_em(&self) -> Rich {
        let mut out = Rich {
            links: self.links.clone(),
            ..Default::default()
        };
        for (r, m) in &self.spans {
            out.push(&self.text[r.clone()], Marks { em: false, ..*m });
        }
        out
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CalloutKind {
    Note,
    Tip,
    Important,
    Warning,
    Caution,
}

impl CalloutKind {
    pub fn label(self) -> &'static str {
        match self {
            CalloutKind::Note => "Note",
            CalloutKind::Tip => "Tip",
            CalloutKind::Important => "Important",
            CalloutKind::Warning => "Warning",
            CalloutKind::Caution => "Caution",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Align {
    None,
    Left,
    Center,
    Right,
}

/// Where a figure's bytes come from.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MediaSrc {
    /// `blob://<cid>`: served through the Worker's `/img/{cid}`
    Blob(String),
    /// an absolute URL; `cid` when it is a Farfield blob URL (so the media meta still applies)
    Url { url: String, cid: Option<String> },
}

impl MediaSrc {
    pub fn parse(dest: &str) -> Option<Self> {
        if let Some(cid) = dest.strip_prefix("blob://") {
            return valid_id(cid).then(|| MediaSrc::Blob(cid.to_string()));
        }
        if dest.starts_with("https://") || dest.starts_with("http://") {
            let cid = dest
                .split_once("/blobs/")
                .map(|(_, rest)| rest.split(['?', '#', '/']).next().unwrap_or(""))
                .filter(|c| valid_id(c))
                .map(str::to_string);
            return Some(MediaSrc::Url {
                url: dest.to_string(),
                cid,
            });
        }
        None
    }

    pub fn cid(&self) -> Option<&str> {
        match self {
            MediaSrc::Blob(cid) => Some(cid),
            MediaSrc::Url { cid, .. } => cid.as_deref(),
        }
    }
}

pub(super) fn valid_id(s: &str) -> bool {
    !s.is_empty()
        && s.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

#[derive(Clone, Debug, PartialEq)]
pub struct Figure {
    pub src: MediaSrc,
    pub alt: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ListItem {
    pub task: Option<bool>,
    pub body: Vec<Block>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Footnote {
    pub label: String,
    pub number: usize,
    pub body: Vec<Block>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Block {
    Heading {
        level: u8,
        text: Rich,
    },
    Para(Rich),
    Quote(Vec<Block>),
    Callout {
        kind: CalloutKind,
        body: Vec<Block>,
    },
    List {
        start: Option<u64>,
        items: Vec<ListItem>,
    },
    Code {
        lang: String,
        code: String,
    },
    Mermaid(String),
    Recipe(Box<RecipeBlock>),
    Table {
        aligns: Vec<Align>,
        head: Vec<Rich>,
        rows: Vec<Vec<Rich>>,
    },
    Rule,
    Figure(Figure),
    Series(String),
    Reveal {
        label: String,
        body: Vec<Block>,
    },
    /// a web component the browser draws over the page (see dom_embed)
    Embed {
        name: String,
        props: Vec<(String, String)>,
    },
    Nothing,
    UnknownComponent(String),
    Footnotes(Vec<Footnote>),
}

#[derive(Clone, Copy, Debug, Default)]
pub struct ParseOptions {
    /// stanzas keep their line breaks: a soft break becomes `\n` rather than a space
    pub keep_line_breaks: bool,
}
