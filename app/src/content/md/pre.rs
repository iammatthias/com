//! What's done to the source before pulldown sees it.

use std::ops::Range;

// GFM alerts: `> [!NOTE] text` on one line is accepted by the old site; pulldown wants the
// marker alone on its line, so split it.

pub(super) fn normalize_alerts(src: &str) -> String {
    let mut out = String::with_capacity(src.len() + 16);
    for line in src.split_inclusive('\n') {
        let trimmed = line.trim_start();
        let indent = &line[..line.len() - trimmed.len()];
        if let Some(rest) = trimmed.strip_prefix('>') {
            let rest_t = rest.trim_start();
            if let Some(after) = rest_t.strip_prefix("[!") {
                if let Some(close) = after.find(']') {
                    let kind = &after[..close];
                    let tail = after[close + 1..].trim();
                    let known = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]
                        .iter()
                        .any(|k| k.eq_ignore_ascii_case(kind));
                    if known && !tail.is_empty() {
                        out.push_str(&format!(
                            "{indent}> [!{}]\n{indent}> {tail}\n",
                            kind.to_ascii_uppercase()
                        ));
                        continue;
                    }
                    if known {
                        out.push_str(&format!("{indent}> [!{}]\n", kind.to_ascii_uppercase()));
                        continue;
                    }
                }
            }
        }
        out.push_str(line);
    }
    out
}

// ---------------------------------------------------------------------------------------------
// `<ff-*>` components, lifted out before markdown parsing (outside code), as `transform.ts`.

#[derive(Clone, Debug, PartialEq)]
pub struct Component {
    pub name: String,
    pub props: Vec<(String, String)>,
    pub children: String,
}

impl Component {
    pub fn prop(&self, key: &str) -> Option<&str> {
        self.props
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    }
}

pub(super) const PLACEHOLDER: &str = "<!--ffcomp:";

/// Replace `<ff-…>…</ff-…>` with `<!--ffcomp:N-->` paragraphs, returning the found tags.
pub fn extract_components(body: &str) -> (String, Vec<Component>) {
    let masked = mask_code(body);
    let mut found = Vec::new();
    let mut out = String::with_capacity(body.len());
    let mut cursor = 0;
    let mut i = 0;
    let bytes = masked.as_bytes();
    while let Some(off) = masked[i..].find("<ff-") {
        let start = i + off;
        let name_start = start + 1;
        let mut j = start + 4;
        while j < bytes.len()
            && (bytes[j].is_ascii_lowercase() || bytes[j].is_ascii_digit() || bytes[j] == b'-')
        {
            j += 1;
        }
        let name = &masked[name_start..j];
        // the opening tag runs to the first `>` not inside quotes
        let mut k = j;
        let mut quote: Option<u8> = None;
        while k < bytes.len() {
            let c = bytes[k];
            match quote {
                Some(q) if c == q => quote = None,
                Some(_) => {}
                None if c == b'"' || c == b'\'' => quote = Some(c),
                None if c == b'>' => break,
                None => {}
            }
            k += 1;
        }
        if k >= bytes.len() || name.len() <= 3 {
            i = j;
            continue;
        }
        let attrs_raw = &body[j..k];
        let self_closing = attrs_raw.trim_end().ends_with('/');
        let attrs_raw = attrs_raw.trim_end().trim_end_matches('/');
        let open_end = k + 1;
        let close_tag = format!("</{name}>");
        let (children, end) = if self_closing {
            (String::new(), open_end)
        } else if let Some(c) = masked[open_end..].find(&close_tag) {
            (
                body[open_end..open_end + c].to_string(),
                open_end + c + close_tag.len(),
            )
        } else {
            (String::new(), open_end)
        };
        out.push_str(&body[cursor..start]);
        out.push_str(&format!("\n\n{PLACEHOLDER}{}-->\n\n", found.len()));
        found.push(Component {
            name: name.to_string(),
            props: parse_attrs(attrs_raw),
            children,
        });
        cursor = end;
        i = end;
    }
    out.push_str(&body[cursor..]);
    (out, found)
}

fn parse_attrs(raw: &str) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let b = raw.as_bytes();
    let mut i = 0;
    while i < b.len() {
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        let ks = i;
        while i < b.len() && !b[i].is_ascii_whitespace() && b[i] != b'=' {
            i += 1;
        }
        if ks == i {
            i += 1;
            continue;
        }
        let key = raw[ks..i].to_ascii_lowercase();
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        let mut value = String::new();
        if i < b.len() && b[i] == b'=' {
            i += 1;
            while i < b.len() && b[i].is_ascii_whitespace() {
                i += 1;
            }
            if i < b.len() && (b[i] == b'"' || b[i] == b'\'') {
                let q = b[i];
                let vs = i + 1;
                i = vs;
                while i < b.len() && b[i] != q {
                    i += 1;
                }
                value = raw[vs..i.min(b.len())].to_string();
                i += 1;
            } else {
                let vs = i;
                while i < b.len() && !b[i].is_ascii_whitespace() {
                    i += 1;
                }
                value = raw[vs..i].to_string();
            }
        }
        out.push((key, decode_entities(&value)));
    }
    out
}

/// Blank out fenced and inline code (keeping byte offsets) so tags inside code are ignored.
fn mask_code(src: &str) -> String {
    let mut out: Vec<u8> = src.as_bytes().to_vec();
    let blank = |out: &mut Vec<u8>, r: Range<usize>| {
        for b in &mut out[r] {
            if *b != b'\n' {
                *b = b' ';
            }
        }
    };
    // fenced blocks
    let mut pos = 0;
    let mut fence: Option<(usize, &str)> = None;
    for line in src.split_inclusive('\n') {
        let t = line.trim_start();
        let marker = if t.starts_with("```") {
            Some("```")
        } else if t.starts_with("~~~") {
            Some("~~~")
        } else {
            None
        };
        match (fence, marker) {
            (None, Some(m)) => fence = Some((pos, m)),
            (Some((start, m)), Some(m2)) if m == m2 => {
                blank(&mut out, start..pos + line.len());
                fence = None;
            }
            _ => {}
        }
        pos += line.len();
    }
    // inline code spans on one line
    let s = String::from_utf8(out.clone()).unwrap_or_default();
    let mut i = 0;
    let bytes = s.as_bytes();
    while i < bytes.len() {
        if bytes[i] == b'`' {
            if let Some(len) = s[i + 1..].find(['`', '\n']) {
                let end = i + 1 + len;
                if bytes[end] == b'`' {
                    blank(&mut out, i..end + 1);
                    i = end + 1;
                    continue;
                }
            }
        }
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| src.to_string())
}

/// Text of an HTML fragment: tags dropped, `<br>` and block ends as newlines, entities decoded.
pub fn strip_html(html: &str) -> String {
    let mut out = String::new();
    let mut rest = html;
    while let Some(lt) = rest.find('<') {
        out.push_str(&rest[..lt]);
        let Some(gt) = rest[lt..].find('>') else {
            out.push_str(&rest[lt..]);
            rest = "";
            break;
        };
        let tag = rest[lt + 1..lt + gt].trim().to_ascii_lowercase();
        let name = tag
            .trim_start_matches('/')
            .split(|c: char| c.is_whitespace() || c == '/')
            .next()
            .unwrap_or("");
        if matches!(
            name,
            "br" | "p" | "div" | "li" | "tr" | "h1" | "h2" | "h3" | "h4" | "figcaption"
        ) {
            out.push('\n');
        }
        rest = &rest[lt + gt + 1..];
    }
    out.push_str(rest);
    let text = decode_entities(&out);
    text.lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn decode_entities(s: &str) -> String {
    if !s.contains('&') {
        return s.to_string();
    }
    s.replace("&nbsp;", "\u{a0}")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&mdash;", "—")
        .replace("&ndash;", "–")
        .replace("&hellip;", "…")
        .replace("&amp;", "&")
}
