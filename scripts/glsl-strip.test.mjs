import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { stripGlsl } from "./glsl-strip.mjs";

const frag = readFileSync(
    new URL("../src/components/AzulejoTile/azulejo.frag", import.meta.url),
    "utf8",
);
const vert = readFileSync(
    new URL("../src/components/AzulejoTile/azulejo.vert", import.meta.url),
    "utf8",
);

describe("the shader satisfies what stripGlsl assumes", () => {
    for (const [name, src] of [["frag", frag], ["vert", vert]]) {
        test(`${name}: no backslash line-continuations`, () => {
            expect(src.match(/\\\s*\n/g)).toBeNull();
        });

        test(`${name}: no code shares a line with a // comment`, () => {
            expect(src.match(/^[^/\n]*\S[^/\n]*\/\/[^\n]*/gm)).toBeNull();
        });

        test(`${name}: stripping preserves brace and paren balance`, () => {
            const out = stripGlsl(src);
            const bare = src
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/[^\n]*/g, "");
            for (const [open, close] of [["{", "}"], ["(", ")"]]) {
                expect(out.split(open).length).toBe(out.split(close).length);
                expect(out.split(open).length).toBe(bare.split(open).length);
            }
        });

        test(`${name}: every preprocessor directive survives on its own line`, () => {
            const directives = (s) =>
                s.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("#"));
            expect(directives(stripGlsl(src))).toEqual(directives(src));
        });

        test(`${name}: stripping is idempotent`, () => {
            expect(stripGlsl(stripGlsl(src))).toBe(stripGlsl(src));
        });

        test(`${name}: every output line is a trimmed source line, in order`, () => {
            const out = stripGlsl(src).split("\n");
            const bare = src
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/[^\n]*/g, "")
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean);
            expect(out).toEqual(bare);
        });
    }

    test("the strip is actually worth doing", () => {
        expect(stripGlsl(frag).length).toBeLessThan(frag.length * 0.7);
    });

    test("no semantic token is lost", () => {
        const tokens = (s) => (s.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []).join(" ");
        const withoutComments = frag
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/[^\n]*/g, "");
        expect(tokens(stripGlsl(frag))).toBe(tokens(withoutComments));
    });
});

describe("stripGlsl", () => {
    test("removes block comments, line comments, indentation and blank lines", () => {
        const src = "  /* a */\n  float x = 1.0; // trailing\n\n\n  return x;\n";
        expect(stripGlsl(src)).toBe("float x = 1.0;\nreturn x;");
    });

    test("keeps newlines between statements", () => {
        expect(stripGlsl("  a;\n  b;\n")).toBe("a;\nb;");
    });
});
