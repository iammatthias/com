//! pulldown's event stream → the block tree.

use pulldown_cmark::{Alignment, BlockQuoteKind, CodeBlockKind, Event, HeadingLevel, Tag, TagEnd};

use super::super::recipe;
use super::parse_with;
use super::pre::{Component, PLACEHOLDER, strip_html};
use super::types::*;

enum Frame {
    Root(Vec<Block>),
    Quote(Option<BlockQuoteKind>, Vec<Block>),
    List(Option<u64>, Vec<ListItem>),
    Item(Option<bool>, Vec<Block>),
    Footnote(String, Vec<Block>),
    Table {
        aligns: Vec<Align>,
        head: Vec<Rich>,
        rows: Vec<Vec<Rich>>,
        in_head: bool,
    },
}

impl Frame {
    fn blocks(&mut self) -> Option<&mut Vec<Block>> {
        match self {
            Frame::Root(b) | Frame::Quote(_, b) | Frame::Item(_, b) | Frame::Footnote(_, b) => {
                Some(b)
            }
            _ => None,
        }
    }
}

#[derive(PartialEq)]
enum InlineKind {
    Para,
    Heading(u8),
    Cell,
}

struct Inline {
    kind: InlineKind,
    rich: Rich,
}

pub(super) struct Builder {
    opts: ParseOptions,
    components: Vec<Component>,
    stack: Vec<Frame>,
    inline: Option<Inline>,
    marks: Marks,
    em: u8,
    strong: u8,
    strike: u8,
    link_stack: Vec<Option<u16>>,
    /// inside an image: collecting its alt text
    image: Option<(String, String)>,
    code: Option<(String, String)>,
    html: Option<String>,
    footnotes: Vec<Footnote>,
    footnote_order: Vec<String>,
}

impl Builder {
    pub(super) fn new(opts: ParseOptions, components: Vec<Component>) -> Self {
        Self {
            opts,
            components,
            stack: vec![Frame::Root(Vec::new())],
            inline: None,
            marks: Marks::default(),
            em: 0,
            strong: 0,
            strike: 0,
            link_stack: Vec::new(),
            image: None,
            code: None,
            html: None,
            footnotes: Vec::new(),
            footnote_order: Vec::new(),
        }
    }

    fn push_block(&mut self, block: Block) {
        for frame in self.stack.iter_mut().rev() {
            if let Some(blocks) = frame.blocks() {
                blocks.push(block);
                return;
            }
        }
    }

    fn open_inline(&mut self, kind: InlineKind) {
        self.flush_inline();
        self.inline = Some(Inline {
            kind,
            rich: Rich::default(),
        });
    }

    fn ensure_inline(&mut self) -> &mut Rich {
        let inline = self.inline.get_or_insert_with(|| Inline {
            kind: InlineKind::Para,
            rich: Rich::default(),
        });
        &mut inline.rich
    }

    fn flush_inline(&mut self) {
        let Some(inline) = self.inline.take() else {
            return;
        };
        match inline.kind {
            InlineKind::Para => {
                let rich = inline.rich.trimmed();
                if !rich.is_blank() {
                    self.push_block(Block::Para(rich));
                }
            }
            InlineKind::Heading(level) => self.push_block(Block::Heading {
                level,
                text: inline.rich.trimmed(),
            }),
            InlineKind::Cell => {
                if let Some(Frame::Table {
                    head,
                    rows,
                    in_head,
                    ..
                }) = self.stack.last_mut()
                {
                    let cell = inline.rich.trimmed();
                    if *in_head {
                        head.push(cell);
                    } else if let Some(row) = rows.last_mut() {
                        row.push(cell);
                    }
                }
            }
        }
    }

    fn text(&mut self, s: &str) {
        if let Some((_, alt)) = self.image.as_mut() {
            alt.push_str(s);
            return;
        }
        if let Some((_, code)) = self.code.as_mut() {
            code.push_str(s);
            return;
        }
        let marks = self.marks;
        self.ensure_inline().push(s, marks);
    }

    fn refresh_marks(&mut self) {
        self.marks.em = self.em > 0;
        self.marks.strong = self.strong > 0;
        self.marks.strike = self.strike > 0;
        self.marks.link = self.link_stack.last().copied().flatten();
    }

    pub(super) fn event(&mut self, event: Event) {
        match event {
            Event::Start(tag) => self.start(tag),
            Event::End(tag) => self.end(tag),
            Event::Text(t) => self.text(&t),
            Event::Code(t) => {
                if let Some((_, alt)) = self.image.as_mut() {
                    alt.push_str(&t);
                    return;
                }
                let marks = Marks {
                    code: true,
                    ..self.marks
                };
                self.ensure_inline().push(&t, marks);
            }
            Event::InlineMath(t) | Event::DisplayMath(t) => {
                let marks = Marks {
                    code: true,
                    ..self.marks
                };
                self.ensure_inline().push(&t, marks);
            }
            Event::Html(h) => {
                if let Some(buf) = self.html.as_mut() {
                    buf.push_str(&h);
                } else {
                    self.html_block(&h);
                }
            }
            Event::InlineHtml(h) => {
                let lower = h.to_ascii_lowercase();
                if lower.starts_with("<br") {
                    let marks = self.marks;
                    self.ensure_inline().push("\n", marks);
                }
            }
            Event::FootnoteReference(label) => {
                let n = match self.footnote_order.iter().position(|l| *l == *label) {
                    Some(i) => i + 1,
                    None => {
                        self.footnote_order.push(label.to_string());
                        self.footnote_order.len()
                    }
                };
                let marks = Marks {
                    note: true,
                    ..Marks::default()
                };
                self.ensure_inline().push(&format!("[{n}]"), marks);
            }
            Event::SoftBreak => {
                let br = if self.opts.keep_line_breaks {
                    "\n"
                } else {
                    " "
                };
                if let Some((_, alt)) = self.image.as_mut() {
                    alt.push(' ');
                } else {
                    let marks = self.marks;
                    self.ensure_inline().push(br, marks);
                }
            }
            Event::HardBreak => {
                let marks = self.marks;
                self.ensure_inline().push("\n", marks);
            }
            Event::Rule => {
                self.flush_inline();
                self.push_block(Block::Rule);
            }
            Event::TaskListMarker(checked) => {
                if let Some(Frame::Item(task, _)) = self.stack.last_mut() {
                    *task = Some(checked);
                }
            }
        }
    }

    fn start(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => self.open_inline(InlineKind::Para),
            Tag::Heading { level, .. } => {
                self.open_inline(InlineKind::Heading(heading_level(level)))
            }
            Tag::BlockQuote(kind) => {
                self.flush_inline();
                self.stack.push(Frame::Quote(kind, Vec::new()));
            }
            Tag::CodeBlock(kind) => {
                self.flush_inline();
                let lang = match kind {
                    CodeBlockKind::Fenced(info) => {
                        info.split_whitespace().next().unwrap_or("").to_string()
                    }
                    CodeBlockKind::Indented => String::new(),
                };
                self.code = Some((lang, String::new()));
            }
            Tag::HtmlBlock => {
                self.flush_inline();
                self.html = Some(String::new());
            }
            Tag::List(start) => {
                self.flush_inline();
                self.stack.push(Frame::List(start, Vec::new()));
            }
            Tag::Item => {
                self.flush_inline();
                self.stack.push(Frame::Item(None, Vec::new()));
            }
            Tag::FootnoteDefinition(label) => {
                self.flush_inline();
                self.stack
                    .push(Frame::Footnote(label.to_string(), Vec::new()));
            }
            Tag::Table(aligns) => {
                self.flush_inline();
                let aligns = aligns
                    .into_iter()
                    .map(|a| match a {
                        Alignment::None => Align::None,
                        Alignment::Left => Align::Left,
                        Alignment::Center => Align::Center,
                        Alignment::Right => Align::Right,
                    })
                    .collect();
                self.stack.push(Frame::Table {
                    aligns,
                    head: Vec::new(),
                    rows: Vec::new(),
                    in_head: false,
                });
            }
            Tag::TableHead => {
                if let Some(Frame::Table { in_head, .. }) = self.stack.last_mut() {
                    *in_head = true;
                }
            }
            Tag::TableRow => {
                if let Some(Frame::Table { rows, in_head, .. }) = self.stack.last_mut() {
                    if !*in_head {
                        rows.push(Vec::new());
                    }
                }
            }
            Tag::TableCell => self.open_inline(InlineKind::Cell),
            Tag::Emphasis => {
                self.em += 1;
                self.refresh_marks();
            }
            Tag::Strong => {
                self.strong += 1;
                self.refresh_marks();
            }
            Tag::Strikethrough => {
                self.strike += 1;
                self.refresh_marks();
            }
            Tag::Link { dest_url, .. } => {
                let rich = self.ensure_inline();
                let idx = rich.links.len() as u16;
                rich.links.push(dest_url.to_string());
                self.link_stack.push(Some(idx));
                self.refresh_marks();
            }
            Tag::Image { dest_url, .. } => {
                self.image = Some((dest_url.to_string(), String::new()));
            }
            Tag::DefinitionList | Tag::DefinitionListTitle | Tag::DefinitionListDefinition => {
                self.flush_inline()
            }
            Tag::Superscript | Tag::Subscript | Tag::MetadataBlock(_) => {}
        }
    }

    fn end(&mut self, tag: TagEnd) {
        match tag {
            TagEnd::Paragraph | TagEnd::Heading(_) => self.flush_inline(),
            TagEnd::BlockQuote(_) => {
                self.flush_inline();
                if let Some(Frame::Quote(kind, body)) = self.stack.pop() {
                    let block = match kind {
                        Some(k) => Block::Callout {
                            kind: callout_kind(k),
                            body,
                        },
                        None => Block::Quote(body),
                    };
                    self.push_block(block);
                }
            }
            TagEnd::CodeBlock => {
                if let Some((lang, code)) = self.code.take() {
                    let code = code.trim_end_matches('\n').to_string();
                    let block = match lang.as_str() {
                        "recipe" => Block::Recipe(Box::new(recipe::block(&code))),
                        "mermaid" => Block::Mermaid(code),
                        _ => Block::Code { lang, code },
                    };
                    self.push_block(block);
                }
            }
            TagEnd::HtmlBlock => {
                if let Some(h) = self.html.take() {
                    self.html_block(&h);
                }
            }
            TagEnd::List(_) => {
                self.flush_inline();
                if let Some(Frame::List(start, items)) = self.stack.pop() {
                    self.push_block(Block::List { start, items });
                }
            }
            TagEnd::Item => {
                self.flush_inline();
                if let Some(Frame::Item(task, body)) = self.stack.pop() {
                    if let Some(Frame::List(_, items)) = self.stack.last_mut() {
                        items.push(ListItem { task, body });
                    }
                }
            }
            TagEnd::FootnoteDefinition => {
                self.flush_inline();
                if let Some(Frame::Footnote(label, body)) = self.stack.pop() {
                    self.footnotes.push(Footnote {
                        label,
                        number: 0,
                        body,
                    });
                }
            }
            TagEnd::Table => {
                self.flush_inline();
                if let Some(Frame::Table {
                    aligns, head, rows, ..
                }) = self.stack.pop()
                {
                    self.push_block(Block::Table { aligns, head, rows });
                }
            }
            TagEnd::TableHead => {
                self.flush_inline();
                if let Some(Frame::Table { in_head, .. }) = self.stack.last_mut() {
                    *in_head = false;
                }
            }
            TagEnd::TableRow => self.flush_inline(),
            TagEnd::TableCell => self.flush_inline(),
            TagEnd::Emphasis => {
                self.em = self.em.saturating_sub(1);
                self.refresh_marks();
            }
            TagEnd::Strong => {
                self.strong = self.strong.saturating_sub(1);
                self.refresh_marks();
            }
            TagEnd::Strikethrough => {
                self.strike = self.strike.saturating_sub(1);
                self.refresh_marks();
            }
            TagEnd::Link => {
                self.link_stack.pop();
                self.refresh_marks();
            }
            TagEnd::Image => {
                if let Some((dest, alt)) = self.image.take() {
                    self.image_done(dest, alt);
                }
            }
            TagEnd::DefinitionList
            | TagEnd::DefinitionListTitle
            | TagEnd::DefinitionListDefinition => self.flush_inline(),
            TagEnd::Superscript | TagEnd::Subscript | TagEnd::MetadataBlock(_) => {}
        }
    }

    /// An image inside a paragraph splits it: text before, the figure, text after.
    /// Inside headings and table cells it reads as its alt text.
    fn image_done(&mut self, dest: String, alt: String) {
        let in_para = self
            .inline
            .as_ref()
            .is_none_or(|i| i.kind == InlineKind::Para);
        let block = if let Some(slug) = dest.strip_prefix("series://") {
            valid_id(slug).then(|| Block::Series(slug.to_string()))
        } else {
            MediaSrc::parse(&dest).map(|src| {
                Block::Figure(Figure {
                    src,
                    alt: alt.trim().to_string(),
                })
            })
        };
        match block {
            Some(block) if in_para => {
                self.flush_inline();
                self.push_block(block);
            }
            _ => {
                let marks = self.marks;
                if !alt.is_empty() {
                    self.ensure_inline().push(&alt, marks);
                }
            }
        }
    }

    fn html_block(&mut self, html: &str) {
        let t = html.trim();
        if let Some(rest) = t.strip_prefix(PLACEHOLDER) {
            if let Some(n) = rest
                .strip_suffix("-->")
                .and_then(|n| n.parse::<usize>().ok())
            {
                if let Some(c) = self.components.get(n).cloned() {
                    let block = component_block(&c, self.opts);
                    self.push_block(block);
                    return;
                }
            }
        }
        if t.starts_with("<!--") {
            return;
        }
        let text = strip_html(t);
        if !text.is_empty() {
            self.push_block(Block::Para(Rich::plain(text)));
        }
    }

    pub(super) fn finish(mut self) -> Vec<Block> {
        self.flush_inline();
        while self.stack.len() > 1 {
            // unbalanced (shouldn't happen with pulldown); fold into root
            let frame = self.stack.pop().expect("more than one frame");
            if let Frame::Quote(_, body) | Frame::Item(_, body) | Frame::Footnote(_, body) = frame {
                for b in body {
                    self.push_block(b);
                }
            }
        }
        let Some(Frame::Root(mut blocks)) = self.stack.pop() else {
            return Vec::new();
        };
        if !self.footnotes.is_empty() {
            let order = &self.footnote_order;
            let mut notes: Vec<Footnote> = self
                .footnotes
                .into_iter()
                .filter_map(|mut f| {
                    let i = order.iter().position(|l| *l == f.label)?;
                    f.number = i + 1;
                    Some(f)
                })
                .collect();
            notes.sort_by_key(|f| f.number);
            if !notes.is_empty() {
                blocks.push(Block::Footnotes(notes));
            }
        }
        blocks
    }
}

fn component_block(c: &Component, opts: ParseOptions) -> Block {
    match c.name.as_str() {
        "ff-reveal" => Block::Reveal {
            label: c
                .prop("label")
                .map(str::trim)
                .filter(|l| !l.is_empty())
                .unwrap_or("Show")
                .to_string(),
            body: parse_with(&c.children, opts),
        },
        name if crate::dom_embed::lookup(name).is_some() => Block::Embed {
            name: name.to_string(),
            props: c.props.clone(),
        },
        "ff-nothing" => Block::Nothing,
        other => Block::UnknownComponent(other.to_string()),
    }
}

fn heading_level(l: HeadingLevel) -> u8 {
    match l {
        HeadingLevel::H1 => 1,
        HeadingLevel::H2 => 2,
        HeadingLevel::H3 => 3,
        HeadingLevel::H4 => 4,
        HeadingLevel::H5 => 5,
        HeadingLevel::H6 => 6,
    }
}

fn callout_kind(k: BlockQuoteKind) -> CalloutKind {
    match k {
        BlockQuoteKind::Note => CalloutKind::Note,
        BlockQuoteKind::Tip => CalloutKind::Tip,
        BlockQuoteKind::Important => CalloutKind::Important,
        BlockQuoteKind::Warning => CalloutKind::Warning,
        BlockQuoteKind::Caution => CalloutKind::Caution,
    }
}

#[cfg(test)]
mod tests {
    use super::super::*;

    fn para(b: &Block) -> &Rich {
        match b {
            Block::Para(r) => r,
            other => panic!("expected para, got {other:?}"),
        }
    }

    #[test]
    fn headings_and_inline_marks() {
        let blocks = parse(
            "# Title\n\nSome *em* and **strong** with `code`, ~~gone~~ and [a link](/posts/x).",
        );
        assert_eq!(blocks.len(), 2);
        assert!(matches!(&blocks[0], Block::Heading { level: 1, text } if text.text == "Title"));
        let p = para(&blocks[1]);
        assert_eq!(p.text, "Some em and strong with code, gone and a link.");
        let marks_of = |needle: &str| {
            let at = p.text.find(needle).unwrap();
            p.spans.iter().find(|(r, _)| r.contains(&at)).unwrap().1
        };
        assert!(marks_of("em ").em);
        assert!(marks_of("strong").strong);
        assert!(marks_of("code").code);
        assert!(marks_of("gone").strike);
        assert_eq!(marks_of("a link").link, Some(0));
        assert_eq!(p.links, vec!["/posts/x".to_string()]);
        // spans are contiguous and cover the whole string
        let mut at = 0;
        for (r, _) in &p.spans {
            assert_eq!(r.start, at);
            at = r.end;
        }
        assert_eq!(at, p.text.len());
    }

    #[test]
    fn nested_marks_merge() {
        let blocks = parse("***both*** plain");
        let p = para(&blocks[0]);
        assert_eq!(
            p.spans[0].1,
            Marks {
                em: true,
                strong: true,
                ..Default::default()
            }
        );
        assert!(p.spans[1].1.plain());
    }

    #[test]
    fn callouts() {
        for src in ["> [!NOTE]\n> Remember this.", "> [!NOTE] Remember this."] {
            let blocks = parse(src);
            match &blocks[0] {
                Block::Callout {
                    kind: CalloutKind::Note,
                    body,
                } => assert_eq!(para(&body[0]).text, "Remember this."),
                other => panic!("{src}: {other:?}"),
            }
        }
        assert!(matches!(
            &parse("> [!caution]\n> hot")[0],
            Block::Callout {
                kind: CalloutKind::Caution,
                ..
            }
        ));
        assert!(matches!(&parse("> just a quote")[0], Block::Quote(_)));
    }

    #[test]
    fn lists_nested_and_tasks() {
        let blocks = parse("- one\n- two\n  1. inner\n  2. inner two\n- [x] done\n- [ ] todo");
        let Block::List { start: None, items } = &blocks[0] else {
            panic!()
        };
        assert_eq!(items.len(), 4);
        assert_eq!(para(&items[0].body[0]).text, "one");
        assert!(
            matches!(&items[1].body[1], Block::List { start: Some(1), items } if items.len() == 2)
        );
        assert_eq!(items[2].task, Some(true));
        assert_eq!(items[3].task, Some(false));
    }

    #[test]
    fn code_mermaid_recipe() {
        let blocks = parse(
            "```rust\nfn main() {}\n```\n\n```mermaid\ngraph TD; A-->B\n```\n\n```recipe\nnot: [valid\n```",
        );
        assert!(
            matches!(&blocks[0], Block::Code { lang, code } if lang == "rust" && code == "fn main() {}")
        );
        assert!(matches!(&blocks[1], Block::Mermaid(s) if s.starts_with("graph")));
        assert!(matches!(&blocks[2], Block::Recipe(_)));
    }

    #[test]
    fn tables() {
        let blocks = parse("| a | b |\n|:--|--:|\n| 1 | *2* |\n| 3 | 4 |");
        let Block::Table { aligns, head, rows } = &blocks[0] else {
            panic!("{blocks:?}")
        };
        assert_eq!(aligns, &vec![Align::Left, Align::Right]);
        assert_eq!(
            head.iter().map(|h| h.text.as_str()).collect::<Vec<_>>(),
            ["a", "b"]
        );
        assert_eq!(rows.len(), 2);
        assert!(rows[0][1].spans[0].1.em);
    }

    #[test]
    fn embeds_split_paragraphs() {
        let blocks = parse(
            "Before ![a cat](blob://bafkcat) after\n\n![](series://phosphene)\n\n![x](https://blobs.farfield.systems/blobs/bafkabc)",
        );
        assert_eq!(para(&blocks[0]).text, "Before");
        assert!(
            matches!(&blocks[1], Block::Figure(Figure { src: MediaSrc::Blob(c), alt }) if c == "bafkcat" && alt == "a cat")
        );
        assert_eq!(para(&blocks[2]).text, "after");
        assert!(matches!(&blocks[3], Block::Series(s) if s == "phosphene"));
        assert!(
            matches!(&blocks[4], Block::Figure(Figure { src: MediaSrc::Url { cid: Some(c), .. }, .. }) if c == "bafkabc")
        );
    }

    #[test]
    fn components() {
        let src = "Intro\n\n<ff-reveal label=\"Spoiler\">\nHidden *text*\n</ff-reveal>\n\n<ff-tuner></ff-tuner>\n\n<ff-nothing />\n\n<ff-mystery a=1></ff-mystery>\n\n```\n<ff-reveal>in code</ff-reveal>\n```";
        let blocks = parse(src);
        assert_eq!(para(&blocks[0]).text, "Intro");
        match &blocks[1] {
            Block::Reveal { label, body } => {
                assert_eq!(label, "Spoiler");
                assert_eq!(para(&body[0]).text, "Hidden text");
            }
            other => panic!("{other:?}"),
        }
        assert_eq!(
            blocks[2],
            Block::Embed {
                name: "ff-tuner".into(),
                props: vec![]
            }
        );
        assert_eq!(blocks[3], Block::Nothing);
        assert_eq!(blocks[4], Block::UnknownComponent("ff-mystery".into()));
        assert!(matches!(&blocks[5], Block::Code { code, .. } if code.contains("<ff-reveal>")));
    }

    #[test]
    fn html_is_stripped() {
        let blocks = parse(
            "<div class=\"x\">\n<p>Hello &amp; <b>bye</b></p>\n</div>\n\nText with <br> inline",
        );
        assert_eq!(para(&blocks[0]).text, "Hello & bye");
        assert_eq!(para(&blocks[1]).text, "Text with \n inline");
    }

    #[test]
    fn footnotes() {
        let blocks = parse("Claim.[^a] Another.[^b]\n\n[^b]: Second.\n[^a]: First.");
        assert_eq!(para(&blocks[0]).text, "Claim.[1] Another.[2]");
        let Some(Block::Footnotes(notes)) = blocks.last() else {
            panic!("{blocks:?}")
        };
        assert_eq!(notes[0].label, "a");
        assert_eq!(para(&notes[0].body[0]).text, "First.");
        assert_eq!(notes[1].number, 2);
    }

    #[test]
    fn stanza_line_breaks() {
        let blocks = parse_with(
            "line one\nline two",
            ParseOptions {
                keep_line_breaks: true,
            },
        );
        assert_eq!(para(&blocks[0]).text, "line one\nline two");
        assert_eq!(
            para(&parse("line one\nline two")[0]).text,
            "line one line two"
        );
    }

    #[test]
    fn rich_slice_keeps_marks() {
        let p = parse("ab *cd* ef").remove(0);
        let Block::Para(r) = p else { panic!() };
        let s = r.slice(1..5);
        assert_eq!(s.text, "b cd");
        assert!(s.spans.iter().any(|(_, m)| m.em));
        assert!(r.slice(3..5).all_em());
    }
}
