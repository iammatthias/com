import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(css|astro)$/.test(p)) out.push(p);
    }
    return out;
}

const SRC = new URL("../", import.meta.url).pathname;
const files = walk(SRC).map((p) => ({ p: p.slice(SRC.length), s: readFileSync(p, "utf8") }));

/** Hash-seeded generative pieces own their colour space; changing it changes the art. */
const GENERATIVE = [
    "pages/onchain-analytics",
    "components/AzulejoTile",
];
const styled = files.filter((f) => !GENERATIVE.some((g) => f.p.startsWith(g)));

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

describe("colour is authored in OKLab", () => {
    test("no rgb(), rgba(), hsl() or hsla() in styles", () => {
        const offenders = styled.flatMap(({ p, s }) =>
            [...strip(s).matchAll(/\b(rgba?|hsla?)\(/g)].map((m) => `${p}: ${m[1]}()`),
        );
        expect(offenders).toEqual([]);
    });

    test("no hex colours outside the browser-chrome meta tags", () => {
        const offenders = styled.flatMap(({ p, s }) =>
            strip(s)
                .split("\n")
                .flatMap((line, i) =>
                    /#[0-9a-fA-F]{3,8}\b/.test(line) && !/theme-color|content="#/.test(line)
                        ? [`${p}:${i + 1} ${line.trim().slice(0, 60)}`]
                        : [],
                ),
        );
        expect(offenders).toEqual([]);
    });

    test("every colour-mix interpolates in oklab, never srgb", () => {
        const spaces = styled.flatMap(({ s }) =>
            [...strip(s).matchAll(/color-mix\(\s*in ([a-z0-9-]+)/g)].map((m) => m[1]),
        );
        expect(spaces.length).toBeGreaterThan(10);
        expect([...new Set(spaces)]).toEqual(["oklab"]);
    });
});

describe("the token layer", () => {
    const globals = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

    test("every colour token is an oklch() value", () => {
        const decls = [...globals.matchAll(/^\s*(--(?:color|callout|sel-stop)[a-z0-9-]*):\s*([^;]+);/gm)];
        expect(decls.length).toBeGreaterThan(15);
        for (const [, name, value] of decls) {
            expect(`${name} = ${value.trim()}`).toContain("oklch(");
        }
    });

    test("a P3 layer widens chroma for the chromatic tokens only", () => {
        const m = globals.match(/@media \(color-gamut: p3\) \{\s*:root \{([\s\S]*?)\}\s*\}/);
        expect(m).not.toBeNull();
        const block = m![1];
        for (const neutral of ["--color-bg", "--color-fg", "--color-border", "--color-muted"]) {
            expect(block).not.toContain(`${neutral}:`);
        }
        for (const chromatic of ["--color-accent", "--callout-caution", "--sel-stop-0"]) {
            expect(block).toContain(`${chromatic}:`);
        }
    });

    test("P3 widening keeps lightness and hue, raising only chroma", () => {
        const parse = (src: string, token: string) => {
            const m = src.match(new RegExp(`${token}: light-dark\\(oklch\\(([\\d.]+)% ([\\d.]+) ([\\d.]+)\\)`));
            return m ? { l: +m[1], c: +m[2], h: +m[3] } : null;
        };
        const p3Block = globals.match(/@media \(color-gamut: p3\)[\s\S]*?\n\}/)![0];
        const base = globals.slice(0, globals.indexOf("@media (color-gamut: p3)"));
        for (const token of ["--color-accent", "--callout-tip", "--sel-stop-2"]) {
            const a = parse(base, token)!;
            const b = parse(p3Block, token)!;
            expect(b.l).toBeCloseTo(a.l, 6);
            expect(b.h).toBeCloseTo(a.h, 6);
            expect(b.c).toBeGreaterThan(a.c);
        }
    });
});
