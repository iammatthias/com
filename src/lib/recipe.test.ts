import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseRecipe, recipeHtml, recipeSimpleHtml, recipeText } from "./recipe";

const fixture = (name: string) =>
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");

describe("recipe rendering matches the captured golden output", () => {
    const src = fixture("recipe.md");

    test("full grid", () => {
        expect(recipeHtml(src)).toBe(fixture("recipe.golden.html"));
    });

    test("simple form", () => {
        expect(recipeSimpleHtml(src)).toBe(fixture("recipe.golden.simple.html"));
    });

    test("text form", () => {
        expect(recipeText(src)).toBe(fixture("recipe.golden.txt"));
    });
});

describe("parseRecipe", () => {
    test("derives ingredient ids from their names when none is given", () => {
        const rec = parseRecipe(
            [
                "ingredients:",
                "  - item: Brandy (VSOP)",
                "  - item: Black Peppercorns",
                "  - id: cream",
                "    item: Heavy cream",
                "steps:",
                "  - in: [brandy-vsop, black-peppercorns]",
                "    do: Reduce",
                "  - in: [cream]",
                "    do: Finish",
            ].join("\n"),
        );
        expect(rec.ingredients.map((i) => i.id)).toEqual([
            "brandy-vsop",
            "black-peppercorns",
            "cream",
        ]);
        expect(rec.steps[0].in).toEqual(["brandy-vsop", "black-peppercorns"]);
    });

    test("rejects an ingredient that no step uses", () => {
        expect(() =>
            parseRecipe(
                "ingredients:\n  - item: Salt\n  - item: Pepper\nsteps:\n  - in: [salt]\n    do: x",
            ),
        ).toThrow("no step uses pepper");
    });

    test("the first step must take an input", () => {
        expect(() =>
            parseRecipe("ingredients:\n  - item: Salt\nsteps:\n  - in: []\n    do: x"),
        ).toThrow("is first and needs an `in`");
    });

    test("rejects a recipe with no ingredients or no steps", () => {
        expect(() => parseRecipe("steps:\n  - do: x")).toThrow("no ingredients");
        expect(() => parseRecipe("ingredients:\n  - item: x")).toThrow("no steps");
    });
});
