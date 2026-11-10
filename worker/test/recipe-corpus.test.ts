import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { layout, parseRecipe, type Recipe } from "../src/lib/recipe";

const dir = new URL("../fixtures/recipe/", import.meta.url);
const read = (name: string) => readFileSync(new URL(name, dir), "utf8");
const cases = readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.slice(0, -".yaml".length))
    .sort();

const neutralRecipe = (rec: Recipe) => ({
    yield: rec.yield,
    time: rec.time,
    source: rec.source,
    sourceURL: rec.sourceURL,
    notes: rec.notes,
    ingredients: rec.ingredients.map((i) => ({
        id: i.id, item: i.item, amount: i.amount, note: i.note, group: i.group,
    })),
    steps: rec.steps.map((s) => ({
        id: s.id, in: s.in, do: s.do, detail: s.detail, for: s.for, phase: s.phase,
        prep: s.prep || undefined, title: s.title, vertical: s.vertical,
    })),
});

const neutralGrids = (rec: Recipe) =>
    layout(rec).map((g) => ({
        title: g.title,
        width: g.width,
        rows: g.rows.map((r) => ({
            ingredient: r.ingredient.id,
            cells: r.cells.map((c) =>
                c.gap
                    ? { gap: c.colSpan }
                    : { step: c.step!.id, rows: c.rowSpan, vertical: c.vertical },
            ),
        })),
    }));

const neutral = (src: string) => {
    let rec: Recipe;
    try {
        rec = parseRecipe(src);
    } catch (e) {
        return { error: (e as Error).message };
    }
    const recipe = neutralRecipe(rec);
    try {
        return { recipe, grids: neutralGrids(rec) };
    } catch (e) {
        return { recipe, layoutError: (e as Error).message };
    }
};

const sharedOnly = (expected: { grids?: { placements?: unknown; blanks?: unknown }[] }) => ({
    ...expected,
    ...(expected.grids && {
        grids: expected.grids.map(({ placements, blanks, ...shared }) => shared),
    }),
});

describe("the shared recipe corpus", () => {
    test("holds every case with an expectation beside it", () => {
        expect(cases.length).toBeGreaterThanOrEqual(23);
        const expectations = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
        expect(expectations).toEqual(cases.map((c) => `${c}.json`).sort());
    });

    for (const name of cases) {
        test(name, () => {
            const got = JSON.parse(JSON.stringify(neutral(read(`${name}.yaml`))));
            expect(got).toEqual(sharedOnly(JSON.parse(read(`${name}.json`))));
        });
    }
});
