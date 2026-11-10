use std::path::{Path, PathBuf};

use serde_json::{Map, Value, json};

use super::recipe::{Cell, Grid, Recipe, layout, parse};

fn corpus() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../worker/fixtures/recipe")
}

fn object(pairs: &[(&str, Value)]) -> Value {
    Value::Object(
        pairs
            .iter()
            .filter(|(_, v)| !v.is_null())
            .map(|(k, v)| (k.to_string(), v.clone()))
            .collect::<Map<_, _>>(),
    )
}

fn neutral_recipe(rec: &Recipe) -> Value {
    object(&[
        ("yield", json!(rec.yields)),
        ("time", json!(rec.time)),
        ("source", json!(rec.source)),
        ("sourceURL", json!(rec.source_url)),
        ("notes", json!(rec.notes)),
        (
            "ingredients",
            rec.ingredients
                .iter()
                .map(|i| {
                    object(&[
                        ("id", json!(i.id)),
                        ("item", json!(i.item)),
                        ("amount", json!(i.amount)),
                        ("note", json!(i.note)),
                        ("group", json!(i.group)),
                    ])
                })
                .collect(),
        ),
        (
            "steps",
            rec.steps
                .iter()
                .map(|s| {
                    object(&[
                        ("id", json!(s.id)),
                        ("in", json!(s.inputs)),
                        ("do", json!(s.action)),
                        ("detail", json!(s.detail)),
                        ("for", json!(s.duration)),
                        ("phase", json!(s.phase)),
                        ("prep", if s.prep { json!(true) } else { Value::Null }),
                        ("title", json!(s.title)),
                        ("vertical", json!(s.vertical)),
                    ])
                })
                .collect(),
        ),
    ])
}

fn neutral_grid(rec: &Recipe, g: &Grid) -> Value {
    let id = |step: usize| rec.steps[step].id.clone();
    json!({
        "title": g.title,
        "width": g.width,
        "rows": g.rows.iter().map(|r| json!({
            "ingredient": rec.ingredients[r.ingredient].id,
            "cells": r.cells.iter().map(|c| match c {
                Cell::Op { step, row_span, vertical } =>
                    json!({ "step": id(*step), "rows": row_span, "vertical": vertical }),
                Cell::Gap { col_span } => json!({ "gap": col_span }),
            }).collect::<Vec<_>>(),
        })).collect::<Vec<_>>(),
        "placements": g.steps.iter().map(|p| json!({
            "step": id(p.step), "col": p.col, "row": p.row, "rows": p.rows,
        })).collect::<Vec<_>>(),
        "blanks": g.blanks.iter().map(|b| json!({
            "row": b.row, "col": b.col, "cols": b.cols,
        })).collect::<Vec<_>>(),
    })
}

fn neutral(src: &str) -> Value {
    let rec = match parse(src) {
        Ok(rec) => rec,
        Err(error) => return json!({ "error": error }),
    };
    let recipe = neutral_recipe(&rec);
    match layout(&rec) {
        Ok(grids) => json!({
            "recipe": recipe,
            "grids": grids.iter().map(|g| neutral_grid(&rec, g)).collect::<Vec<_>>(),
        }),
        Err(error) => json!({ "recipe": recipe, "layoutError": error }),
    }
}

#[test]
fn the_shared_recipe_corpus() {
    let dir = corpus();
    let mut cases: Vec<String> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("{dir:?}: {e}"))
        .flatten()
        .filter_map(|e| {
            e.file_name()
                .to_str()?
                .strip_suffix(".yaml")
                .map(str::to_string)
        })
        .collect();
    cases.sort();
    assert!(cases.len() >= 29, "only {} cases in {dir:?}", cases.len());
    let mut failed = Vec::new();
    for name in &cases {
        let src = std::fs::read_to_string(dir.join(format!("{name}.yaml"))).unwrap();
        let expected: Value = serde_json::from_str(
            &std::fs::read_to_string(dir.join(format!("{name}.json")))
                .unwrap_or_else(|e| panic!("{name}.json: {e}")),
        )
        .unwrap();
        let got = neutral(&src);
        if got != expected {
            failed.push(format!("{name}\n  expected {expected}\n  got      {got}"));
        }
    }
    assert!(failed.is_empty(), "{}", failed.join("\n"));
}
