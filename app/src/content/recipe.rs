//! ```` ```recipe ```` fences: YAML → a validated DAG → the "cooking for engineers" grid.
//! A straight port of the Astro site's `recipe.ts` (parse + layout) and the scaling half of
//! `recipe-interactive.ts`. Pure Rust; the view lives in `recipe_view.rs`.

use std::collections::{HashMap, HashSet};

use serde_yaml::Value;

use super::md::{self, Rich};

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Ingredient {
    pub id: String,
    pub item: String,
    pub amount: Option<String>,
    pub note: Option<String>,
    pub group: Option<String>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Step {
    pub id: String,
    pub inputs: Vec<String>,
    pub action: String,
    pub detail: Option<String>,
    pub duration: Option<String>,
    pub phase: Option<String>,
    pub prep: bool,
    pub title: Option<String>,
    pub vertical: Option<bool>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Recipe {
    pub yields: Option<String>,
    pub time: Option<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub notes: Option<String>,
    pub ingredients: Vec<Ingredient>,
    pub steps: Vec<Step>,
}

/// One grid cell to the right of an ingredient: a step spanning rows, or an empty gap.
#[derive(Clone, Debug, PartialEq)]
pub enum Cell {
    Op {
        step: usize,
        row_span: usize,
        vertical: bool,
    },
    Gap {
        col_span: usize,
    },
}

#[derive(Clone, Debug, PartialEq)]
pub struct Row {
    pub ingredient: usize,
    pub cells: Vec<Cell>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Grid {
    pub title: String,
    pub rows: Vec<Row>,
    pub width: usize,
}

/// Everything the view needs, computed once per payload.
#[derive(Clone, Debug, PartialEq)]
pub enum RecipeBlock {
    Ok {
        recipe: Recipe,
        /// `None` when the DAG can't be laid out as grids; the view falls back to a list
        grids: Option<Vec<Grid>>,
        serves: u32,
        /// rendered inline markdown, parsed once
        notes: Option<Rich>,
        details: Vec<Rich>,
        ingredient_notes: Vec<Option<Rich>>,
    },
    Err {
        message: String,
        source: String,
    },
}

pub fn block(src: &str) -> RecipeBlock {
    match parse(src) {
        Ok(recipe) => {
            let grids = layout(&recipe).ok();
            let serves = recipe
                .yields
                .as_deref()
                .and_then(|y| {
                    let digits: String = y
                        .chars()
                        .skip_while(|c| !c.is_ascii_digit())
                        .take_while(|c| c.is_ascii_digit())
                        .collect();
                    digits.parse().ok()
                })
                .unwrap_or(0);
            let notes = recipe.notes.as_deref().map(md::parse_inline);
            let details = recipe.steps.iter().map(step_text).collect();
            let ingredient_notes = recipe
                .ingredients
                .iter()
                .map(|i| i.note.as_deref().map(md::parse_inline))
                .collect();
            RecipeBlock::Ok {
                recipe,
                grids,
                serves,
                notes,
                details,
                ingredient_notes,
            }
        }
        Err(message) => RecipeBlock::Err {
            message,
            source: src.to_string(),
        },
    }
}

/// The method line for a step: detail when it already leads with the action, otherwise
/// **action** + detail (the bolding happens in the view via the returned split).
fn step_text(st: &Step) -> Rich {
    match st.detail.as_deref() {
        None => md::parse_inline(&st.action),
        Some(d) if leads_with(d, &st.action) => md::parse_inline(d),
        Some(d) => {
            let mut r = Rich::default();
            r.push(
                &st.action,
                md::Marks {
                    strong: true,
                    ..Default::default()
                },
            );
            r.push(" ", md::Marks::default());
            let rest = md::parse_inline(d);
            let base = r.links.len() as u16;
            for (range, m) in &rest.spans {
                r.push(
                    &rest.text[range.clone()],
                    md::Marks {
                        link: m.link.map(|l| l + base),
                        ..*m
                    },
                );
            }
            r.links.extend(rest.links);
            r
        }
    }
}

fn squash(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect()
}

fn leads_with(detail: &str, label: &str) -> bool {
    let l = squash(label);
    !l.is_empty() && squash(detail).starts_with(&l)
}

pub fn slugify(s: &str) -> String {
    let mut out = String::new();
    let mut dash = false;
    for c in s.chars().flat_map(char::to_lowercase) {
        let c = fold_char(c);
        if c.is_ascii_lowercase() || c.is_ascii_digit() {
            if dash && !out.is_empty() {
                out.push('-');
            }
            dash = false;
            out.push(c);
        } else {
            dash = true;
        }
    }
    out
}

fn fold_char(c: char) -> char {
    match c {
        'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' => 'a',
        'è' | 'é' | 'ê' | 'ë' => 'e',
        'ì' | 'í' | 'î' | 'ï' => 'i',
        'ò' | 'ó' | 'ô' | 'õ' | 'ö' => 'o',
        'ù' | 'ú' | 'û' | 'ü' => 'u',
        'ñ' => 'n',
        'ç' => 'c',
        other => other,
    }
}

fn text_of(v: &Value) -> Option<String> {
    match v {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
    .filter(|s| !s.trim().is_empty())
}

fn field(map: &Value, key: &str) -> Option<String> {
    map.get(key).and_then(text_of)
}

pub fn parse(src: &str) -> Result<Recipe, String> {
    let raw: Value = serde_yaml::from_str(src).map_err(|e| format!("recipe: {e}"))?;
    let raw = if raw.is_null() {
        Value::Mapping(Default::default())
    } else {
        raw
    };
    let seq = |k: &str| {
        raw.get(k)
            .and_then(Value::as_sequence)
            .cloned()
            .unwrap_or_default()
    };

    let mut rec = Recipe {
        yields: field(&raw, "yield"),
        time: field(&raw, "time"),
        source: field(&raw, "source"),
        source_url: field(&raw, "sourceURL"),
        notes: field(&raw, "notes"),
        ingredients: seq("ingredients")
            .iter()
            .map(|i| Ingredient {
                id: field(i, "id").unwrap_or_default(),
                item: field(i, "item").unwrap_or_default(),
                amount: field(i, "amount"),
                note: field(i, "note"),
                group: field(i, "group"),
            })
            .collect(),
        steps: seq("steps")
            .iter()
            .map(|s| Step {
                id: field(s, "id").unwrap_or_default(),
                inputs: s
                    .get("in")
                    .map(|v| match v {
                        Value::Sequence(xs) => xs.iter().filter_map(text_of).collect(),
                        other => text_of(other).into_iter().collect(),
                    })
                    .unwrap_or_default(),
                action: field(s, "do").unwrap_or_default(),
                detail: field(s, "detail"),
                duration: field(s, "for"),
                phase: field(s, "phase"),
                prep: s.get("prep").and_then(Value::as_bool).unwrap_or(false),
                title: field(s, "title"),
                vertical: s.get("vertical").and_then(Value::as_bool),
            })
            .collect(),
    };
    if rec.ingredients.is_empty() {
        return Err("recipe: no ingredients".into());
    }
    if rec.steps.is_empty() {
        return Err("recipe: no steps".into());
    }

    let mut taken = HashSet::new();
    for (i, ing) in rec.ingredients.iter_mut().enumerate() {
        if ing.item.trim().is_empty() {
            return Err(format!("recipe: ingredient {} has no item", i + 1));
        }
        let mut id = if ing.id.is_empty() {
            slugify(&ing.item)
        } else {
            ing.id.clone()
        };
        if id.is_empty() {
            id = format!("i{}", i + 1);
        }
        let base = id.clone();
        let mut n = 2;
        while taken.contains(&id) {
            id = format!("{base}-{n}");
            n += 1;
        }
        taken.insert(id.clone());
        ing.id = id;
    }
    for (i, st) in rec.steps.iter_mut().enumerate() {
        if st.action.trim().is_empty() {
            return Err(format!("recipe: step {} has no `do`", i + 1));
        }
        let id = if st.id.is_empty() {
            format!("s{}", i + 1)
        } else {
            st.id.clone()
        };
        if taken.contains(&id) {
            return Err(format!("recipe: duplicate id \"{id}\""));
        }
        taken.insert(id.clone());
        st.id = id;
    }

    let mut prev = String::new();
    for st in rec.steps.iter_mut() {
        if st.prep {
            continue;
        }
        if st.inputs.is_empty() {
            if prev.is_empty() {
                return Err(format!(
                    "recipe: step \"{}\" is first and needs an `in`",
                    st.id
                ));
            }
            st.inputs = vec![prev.clone()];
        }
        prev = st.id.clone();
    }

    let is_ing: HashSet<&str> = rec.ingredients.iter().map(|i| i.id.as_str()).collect();
    let is_step: HashSet<&str> = rec.steps.iter().map(|s| s.id.as_str()).collect();
    let mut used = HashSet::new();
    for st in &rec.steps {
        if st.prep && !st.inputs.is_empty() {
            return Err(format!(
                "recipe: step \"{}\" is `prep` and cannot take an `in`",
                st.id
            ));
        }
        let mut seen = HashSet::new();
        for r in &st.inputs {
            if !is_ing.contains(r.as_str()) && !is_step.contains(r.as_str()) {
                return Err(format!(
                    "recipe: step \"{}\" refers to unknown id \"{r}\"",
                    st.id
                ));
            }
            if *r == st.id {
                return Err(format!("recipe: step \"{}\" refers to itself", st.id));
            }
            if !seen.insert(r.as_str()) {
                return Err(format!("recipe: step \"{}\" lists \"{r}\" twice", st.id));
            }
            used.insert(r.clone());
        }
    }
    let mut orphans: Vec<&str> = rec
        .ingredients
        .iter()
        .map(|i| i.id.as_str())
        .filter(|id| !used.contains(*id))
        .collect();
    if !orphans.is_empty() {
        orphans.sort();
        return Err(format!("recipe: no step uses {}", orphans.join(", ")));
    }

    // cycle check
    let step_at: HashMap<&str, usize> = rec
        .steps
        .iter()
        .enumerate()
        .map(|(i, s)| (s.id.as_str(), i))
        .collect();
    let mut color: HashMap<String, u8> = HashMap::new();
    fn walk(
        id: &str,
        rec: &Recipe,
        step_at: &HashMap<&str, usize>,
        color: &mut HashMap<String, u8>,
    ) -> Result<(), String> {
        let Some(&i) = step_at.get(id) else {
            return Ok(());
        };
        match color.get(id) {
            Some(1) => return Err(format!("recipe: steps form a cycle at \"{id}\"")),
            Some(2) => return Ok(()),
            _ => {}
        }
        color.insert(id.to_string(), 1);
        for r in &rec.steps[i].inputs {
            walk(r, rec, step_at, color)?;
        }
        color.insert(id.to_string(), 2);
        Ok(())
    }
    for s in &rec.steps {
        walk(&s.id, &rec, &step_at, &mut color)?;
    }
    Ok(rec)
}

const AUTO_VERTICAL_MAX: usize = 34;

pub fn layout(rec: &Recipe) -> Result<Vec<Grid>, String> {
    let step_at: HashMap<&str, usize> = rec
        .steps
        .iter()
        .enumerate()
        .map(|(i, s)| (s.id.as_str(), i))
        .collect();
    let ing_at: HashMap<&str, usize> = rec
        .ingredients
        .iter()
        .enumerate()
        .map(|(i, g)| (g.id.as_str(), i))
        .collect();
    let consumed: HashSet<&str> = rec
        .steps
        .iter()
        .flat_map(|s| s.inputs.iter().map(String::as_str))
        .collect();
    let roots: Vec<&Step> = rec
        .steps
        .iter()
        .filter(|s| !s.prep && !consumed.contains(s.id.as_str()))
        .collect();

    let mut grids = Vec::new();
    for root in &roots {
        let mut order: Vec<&str> = Vec::new();
        let mut first: HashMap<&str, usize> = HashMap::new();
        let mut span: HashMap<&str, usize> = HashMap::new();
        let mut col: HashMap<&str, i64> = HashMap::new();
        let mut seen: Vec<&str> = Vec::new();

        #[allow(clippy::too_many_arguments)]
        fn walk<'a>(
            id: &'a str,
            rec: &'a Recipe,
            step_at: &HashMap<&str, usize>,
            ing_at: &HashMap<&str, usize>,
            order: &mut Vec<&'a str>,
            first: &mut HashMap<&'a str, usize>,
            span: &mut HashMap<&'a str, usize>,
            col: &mut HashMap<&'a str, i64>,
            seen: &mut Vec<&'a str>,
        ) -> Result<(), String> {
            if seen.contains(&id) {
                return Err(format!(
                    "recipe: \"{id}\" feeds two branches of the same grid"
                ));
            }
            seen.push(id);
            if ing_at.contains_key(id) {
                first.insert(id, order.len());
                span.insert(id, 1);
                col.insert(id, -1);
                order.push(id);
                return Ok(());
            }
            let st = &rec.steps[step_at[id]];
            let start = order.len();
            let mut best = -1;
            for r in &st.inputs {
                walk(r, rec, step_at, ing_at, order, first, span, col, seen)?;
                best = best.max(col[r.as_str()]);
            }
            first.insert(id, start);
            span.insert(id, order.len() - start);
            col.insert(id, best + 1);
            Ok(())
        }
        walk(
            &root.id, rec, &step_at, &ing_at, &mut order, &mut first, &mut span, &mut col,
            &mut seen,
        )?;

        let rows = order.len();
        let width = (col[root.id.as_str()] + 1) as usize;
        let mut start: Vec<Vec<Option<usize>>> = vec![vec![None; width]; rows];
        let mut covered = vec![vec![false; width]; rows];
        for id in &seen {
            let Some(&si) = step_at.get(id) else { continue };
            let c = col[id] as usize;
            let r0 = first[id];
            let n = span[id];
            if n == 0 {
                continue;
            }
            start[r0][c] = Some(si);
            for k in 0..n {
                covered[r0 + k][c] = true;
            }
        }

        let mut out = Vec::new();
        for r in 0..rows {
            let mut cells = Vec::new();
            let mut c = 0;
            while c < width {
                if let Some(si) = start[r][c] {
                    let st = &rec.steps[si];
                    let n = span[st.id.as_str()];
                    let len = st
                        .action
                        .trim()
                        .chars()
                        .count()
                        .max(st.duration.as_deref().unwrap_or("").trim().chars().count());
                    cells.push(Cell::Op {
                        step: si,
                        row_span: n,
                        vertical: st.vertical.unwrap_or(n >= 2 && len <= AUTO_VERTICAL_MAX),
                    });
                    c += 1;
                    continue;
                }
                if covered[r][c] {
                    c += 1;
                    continue;
                }
                let mut run = 0;
                while c + run < width && !covered[r][c + run] {
                    run += 1;
                }
                cells.push(Cell::Gap { col_span: run });
                c += run;
            }
            out.push(Row {
                ingredient: ing_at[order[r]],
                cells,
            });
        }
        grids.push(Grid {
            title: if roots.len() > 1 {
                root.title.clone().unwrap_or_else(|| root.action.clone())
            } else {
                String::new()
            },
            rows: out,
            width,
        });
    }
    Ok(grids)
}

/// Step column/row placement for a grid, derived from its rows: `(step, col, row0, rows)`.
pub fn placements(grid: &Grid) -> Vec<(usize, usize, usize, usize)> {
    // rebuild the column of each op cell by walking rows with coverage
    let mut covered = vec![vec![false; grid.width]; grid.rows.len()];
    let mut out = Vec::new();
    for (r, row) in grid.rows.iter().enumerate() {
        let mut c = 0;
        let mut cells = row.cells.iter();
        while c < grid.width {
            if covered[r][c] {
                c += 1;
                continue;
            }
            match cells.next() {
                Some(Cell::Op { step, row_span, .. }) => {
                    out.push((*step, c, r, *row_span));
                    for k in 0..*row_span {
                        if r + k < covered.len() {
                            covered[r + k][c] = true;
                        }
                    }
                    c += 1;
                }
                Some(Cell::Gap { col_span }) => c += col_span,
                None => break,
            }
        }
    }
    out
}

// ---------------------------------------------------------------------------------------------
// serves scaling (recipe-interactive.ts)

const VULGAR: [(char, f64); 9] = [
    ('⅛', 1. / 8.),
    ('¼', 1. / 4.),
    ('⅓', 1. / 3.),
    ('⅜', 3. / 8.),
    ('½', 1. / 2.),
    ('⅝', 5. / 8.),
    ('⅔', 2. / 3.),
    ('¾', 3. / 4.),
    ('⅞', 7. / 8.),
];

fn vulgar(c: char) -> Option<f64> {
    VULGAR.iter().find(|(g, _)| *g == c).map(|(_, v)| *v)
}

/// Read one quantity token from the front of `s`: `1 1/2`, `3/4`, `1½`, `½`, `2.5`, `12`.
fn take_qty(s: &str) -> Option<(f64, usize)> {
    let b: Vec<char> = s.chars().collect();
    let mut i = 0;
    let digits = |i: &mut usize| {
        let st = *i;
        while *i < b.len() && b[*i].is_ascii_digit() {
            *i += 1;
        }
        b[st..*i].iter().collect::<String>()
    };
    let whole = digits(&mut i);
    let byte_len = |n: usize| b[..n].iter().map(|c| c.len_utf8()).sum::<usize>();
    // vulgar glyph
    if i < b.len() {
        if let Some(v) = vulgar(b[i]) {
            let w: f64 = whole.parse().unwrap_or(0.);
            return Some((w + v, byte_len(i + 1)));
        }
    }
    if whole.is_empty() {
        return None;
    }
    // mixed "1 1/2"
    if i + 1 < b.len() && b[i] == ' ' && b[i + 1].is_ascii_digit() {
        let mut j = i + 1;
        let n = digits(&mut j);
        if j < b.len() && b[j] == '/' {
            let mut k = j + 1;
            let d = digits(&mut k);
            if !d.is_empty() {
                let v =
                    whole.parse::<f64>().ok()? + n.parse::<f64>().ok()? / d.parse::<f64>().ok()?;
                return Some((v, byte_len(k)));
            }
        }
    }
    // fraction "3/4"
    if i < b.len() && b[i] == '/' {
        let mut k = i + 1;
        let d = digits(&mut k);
        if !d.is_empty() {
            return Some((
                whole.parse::<f64>().ok()? / d.parse::<f64>().ok()?,
                byte_len(k),
            ));
        }
    }
    // decimal
    if i + 1 < b.len() && b[i] == '.' && b[i + 1].is_ascii_digit() {
        let mut k = i + 1;
        let frac = digits(&mut k);
        return Some((format!("{whole}.{frac}").parse().ok()?, byte_len(k)));
    }
    Some((whole.parse().ok()?, byte_len(i)))
}

pub fn fmt_qty(v: f64) -> String {
    if v >= 10. {
        return format!("{}", v.round() as i64);
    }
    let mut best = (f64::INFINITY, v.round() as i64, 1i64);
    for d in [1i64, 2, 3, 4, 8] {
        let n = (v * d as f64).round() as i64;
        let err = (v - n as f64 / d as f64).abs();
        if err < best.0 - 1e-9 {
            best = (err, n, d);
        }
    }
    let (_, n, d) = best;
    let whole = n / d;
    let frac = n as f64 / d as f64 - whole as f64;
    if frac == 0. {
        return whole.to_string();
    }
    match VULGAR.iter().find(|(_, val)| (val - frac).abs() < 1e-9) {
        Some((g, _)) => format!(
            "{}{g}",
            if whole > 0 {
                whole.to_string()
            } else {
                String::new()
            }
        ),
        None => format!("{}", ((whole as f64 + frac) * 100.).round() / 100.),
    }
}

fn fix_units(rest: &str, qty: f64) -> String {
    // only the unit right after the number agrees with it: "1 cup (8 tbsp)" not "(1 cups …)"
    const UNITS: [&str; 8] = [
        "tablespoon",
        "teaspoon",
        "cup",
        "clove",
        "can",
        "sprig",
        "slice",
        "stick",
    ];
    let lead = rest.len() - rest.trim_start().len();
    let word_end = rest[lead..]
        .find(|c: char| !c.is_ascii_alphabetic())
        .map_or(rest.len(), |e| lead + e);
    let word = &rest[lead..word_end];
    let lower = word.to_ascii_lowercase();
    let stem = lower.strip_suffix('s').unwrap_or(&lower);
    if UNITS.contains(&lower.as_str()) || UNITS.contains(&stem) {
        let unit_len = if UNITS.contains(&lower.as_str()) {
            word.len()
        } else {
            word.len() - 1
        };
        let s = if qty > 1. { "s" } else { "" };
        return format!(
            "{}{}{s}{}",
            &rest[..lead],
            &word[..unit_len],
            &rest[word_end..]
        );
    }
    rest.to_string()
}

/// Scale an amount like `1½ cups` or `2–3 cloves` by `f`; `None` if it has no leading number.
pub fn scale_amount(base: &str, f: f64) -> Option<String> {
    let (a, len) = take_qty(base)?;
    let mut rest = &base[len..];
    let mut b = None;
    let t = rest.trim_start();
    if let Some(after) = t.strip_prefix('–').or_else(|| t.strip_prefix('-')) {
        if let Some((v, l2)) = take_qty(after.trim_start()) {
            b = Some(v);
            let after_t = after.trim_start();
            rest = &after_t[l2..];
        }
    }
    let qty = match b {
        Some(b) => format!("{}–{}", fmt_qty(a * f), fmt_qty(b * f)),
        None => fmt_qty(a * f),
    };
    Some(qty + &fix_units(rest, b.unwrap_or(a) * f))
}

/// The yield line scaled: the first number (or range) multiplied.
pub fn scale_yield(base: &str, f: f64) -> String {
    let Some(start) = base.find(|c: char| c.is_ascii_digit()) else {
        return base.to_string();
    };
    let tail = &base[start..];
    let end_lo = tail
        .find(|c: char| !c.is_ascii_digit())
        .unwrap_or(tail.len());
    let lo: f64 = tail[..end_lo].parse().unwrap_or(0.);
    let after = &tail[end_lo..];
    let after_t = after.trim_start();
    let (num, consumed) = if let Some(r) = after_t
        .strip_prefix('–')
        .or_else(|| after_t.strip_prefix('-'))
    {
        let r_t = r.trim_start();
        let end_hi = r_t.find(|c: char| !c.is_ascii_digit()).unwrap_or(r_t.len());
        if end_hi > 0 {
            let hi: f64 = r_t[..end_hi].parse().unwrap_or(0.);
            let used = end_lo + (after.len() - r_t.len()) + end_hi;
            (format!("{}–{}", fmt_qty(lo * f), fmt_qty(hi * f)), used)
        } else {
            (fmt_qty(lo * f), end_lo)
        }
    } else {
        (fmt_qty(lo * f), end_lo)
    };
    format!("{}{num}{}", &base[..start], &tail[consumed..]).replace("1 servings", "1 serving")
}

/// Label for a serves button: `3`, `1½`.
pub fn serves_label(serves: u32, f: f64) -> String {
    let n = serves as f64 * f;
    if n.fract() == 0. {
        format!("{}", n as i64)
    } else {
        format!("{}½", n.floor() as i64)
    }
}

/// `"10–15 min"` → seconds (upper bound), for the step timer later.

pub fn duration_secs(f: &str) -> Option<u32> {
    let lower = f.to_ascii_lowercase();
    let mut h = 0u32;
    let mut m = 0u32;
    let toks: Vec<&str> = lower.split_whitespace().collect();
    for (i, t) in toks.iter().enumerate() {
        let (num, unit) = match t.find(|c: char| c.is_ascii_alphabetic()) {
            Some(at) if at > 0 => (&t[..at], &t[at..]),
            Some(_) => continue,
            None => (*t, toks.get(i + 1).copied().unwrap_or("")),
        };
        let v: u32 = num
            .split(['–', '-'])
            .filter(|s| !s.is_empty())
            .last()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);
        if unit.starts_with('h') {
            h = v;
        } else if unit.starts_with('m') {
            m = v;
        }
    }
    let secs = h * 3600 + m * 60;
    (secs > 0).then_some(secs)
}

#[cfg(test)]
mod tests {
    use super::*;

    const PIZZA: &str = include_str!("fixtures/real-pizza-dough.md");

    fn fence(md: &str) -> String {
        let start = md.find("```recipe\n").unwrap() + "```recipe\n".len();
        let end = md[start..].find("\n```").unwrap() + start;
        md[start..end].to_string()
    }

    #[test]
    fn pizza_dough_grid() {
        let rec = parse(&fence(PIZZA)).unwrap();
        assert_eq!(rec.ingredients.len(), 5);
        assert_eq!(rec.steps.len(), 7);
        let grids = layout(&rec).unwrap();
        assert_eq!(grids.len(), 1);
        let g = &grids[0];
        assert_eq!(g.rows.len(), 5);
        assert_eq!(g.width, 7);
        // s1 spans the four dry ingredients, s2 spans all five
        assert_eq!(
            g.rows[0].cells[0],
            Cell::Op {
                step: 0,
                row_span: 4,
                vertical: true
            }
        );
        let p = placements(g);
        assert!(p.contains(&(0, 0, 0, 4)));
        assert!(p.contains(&(1, 1, 0, 5)));
        assert!(p.contains(&(6, 6, 0, 5)));
        // the oil row has a gap under s1
        assert_eq!(g.rows[4].cells[0], Cell::Gap { col_span: 1 });
        match block(&fence(PIZZA)) {
            RecipeBlock::Ok { serves, .. } => assert_eq!(serves, 2),
            other => panic!("{other:?}"),
        }
    }

    #[test]
    fn errors_are_reported() {
        assert!(
            parse("ingredients: []\nsteps: []")
                .unwrap_err()
                .contains("no ingredients")
        );
        let orphan = "ingredients:\n  - item: salt\n  - item: pepper\nsteps:\n  - in: [salt]\n    do: season";
        assert!(parse(orphan).unwrap_err().contains("no step uses pepper"));
        let cycle = "ingredients:\n  - item: a\nsteps:\n  - id: x\n    in: [a, y]\n    do: one\n  - id: y\n    in: [x]\n    do: two";
        assert!(parse(cycle).unwrap_err().contains("cycle"));
    }

    #[test]
    fn implicit_inputs_chain() {
        let src = "ingredients:\n  - item: Egg\n  - item: Milk\nsteps:\n  - in: [egg, milk]\n    do: whisk\n  - do: cook";
        let rec = parse(src).unwrap();
        assert_eq!(rec.steps[1].inputs, vec!["s1".to_string()]);
        let g = &layout(&rec).unwrap()[0];
        assert_eq!(g.width, 2);
    }

    #[test]
    fn scaling() {
        assert_eq!(scale_amount("1 cup flour", 2.).unwrap(), "2 cups flour");
        assert_eq!(scale_amount("2 cups", 0.5).unwrap(), "1 cup");
        assert_eq!(scale_amount("1½ tsp salt", 2.).unwrap(), "3 tsp salt");
        assert_eq!(scale_amount("3/4 cup", 2.).unwrap(), "1½ cups");
        assert_eq!(scale_amount("1 1/2 cups", 0.5).unwrap(), "¾ cup");
        assert_eq!(
            scale_amount("2–3 cloves garlic", 2.).unwrap(),
            "4–6 cloves garlic"
        );
        assert_eq!(
            scale_amount("153 grams (1 cup plus 1 tbsp)", 2.).unwrap(),
            "306 grams (1 cup plus 1 tbsp)"
        );
        assert_eq!(scale_amount("to taste", 2.), None);
        assert_eq!(
            scale_yield("2 dough balls — two 12-in. pizzas", 0.5),
            "1 dough balls — two 12-in. pizzas"
        );
        assert_eq!(scale_yield("Serves 4–6", 2.), "Serves 8–12");
        assert_eq!(serves_label(3, 0.5), "1½");
        assert_eq!(fmt_qty(0.25), "¼");
        assert_eq!(fmt_qty(12.4), "12");
        assert_eq!(duration_secs("10–15 min"), Some(900));
        assert_eq!(duration_secs("2 h"), Some(7200));
    }

    #[test]
    fn slugs() {
        assert_eq!(slugify("00 flour"), "00-flour");
        assert_eq!(slugify("Crème Fraîche!"), "creme-fraiche");
    }
}
