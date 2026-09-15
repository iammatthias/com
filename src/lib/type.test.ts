import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const globals = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
const all = ["globals.css", "deck.css", "layout.css"]
    .map((f) => readFileSync(new URL(`../styles/${f}`, import.meta.url), "utf8"))
    .join("\n");

function rules(css: string): Array<[string, string]> {
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
        (m) => [m[1].trim().replace(/\s+/g, " "), m[2]] as [string, string],
    );
}

const px = (clamp: string) => {
    const m = clamp.match(/clamp\(\s*([\d.]+)rem[^,]*,[^,]*,\s*([\d.]+)rem\s*\)/);
    if (!m) throw new Error(`not a rem clamp: ${clamp}`);
    return { min: +m[1] * 16, max: +m[2] * 16 };
};

const token = (name: string) => {
    const m = globals.match(new RegExp(`${name}:\\s*([^;]+);`));
    if (!m) throw new Error(`missing ${name}`);
    return m[1].trim();
};

const STEPS = ["--fs-xs", "--fs-sm", "--fs-base", "--fs-lg", "--fs-xl", "--fs-2xl", "--fs-3xl", "--fs-display"];

describe("type scale", () => {
    const sizes = STEPS.map((s) => px(token(s)));

    test("every step is larger than the one below it, at both ends of the clamp", () => {
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i].min).toBeGreaterThan(sizes[i - 1].min);
            expect(sizes[i].max).toBeGreaterThan(sizes[i - 1].max);
        }
    });

    test("no step more than a quarter larger than the one below — no jarring jumps", () => {
        for (let i = 1; i < sizes.length; i++) {
            const ratio = sizes[i].max / sizes[i - 1].max;
            expect(ratio).toBeGreaterThan(1.05);
            expect(ratio).toBeLessThanOrEqual(1.25);
        }
    });

    test("the display step stays within reach of the body copy", () => {
        const base = px(token("--fs-base"));
        expect(px(token("--fs-display")).max / base.max).toBeLessThanOrEqual(2.1);
    });
});

describe("the display face is only loaded at one weight, so nothing may fake a bolder one", () => {
    const serifRules = rules(all).filter(([, body]) => body.includes("--font-serif"));

    test("no rule pairs the serif with a weight above normal", () => {
        const offenders = serifRules.filter(([, body]) =>
            /font-weight:\s*(var\(--fw-(medium|bold)\)|[5-9]00|bold)/.test(body),
        );
        expect(offenders.map(([sel]) => sel)).toEqual([]);
    });

    test("the shared heading rule sets normal explicitly rather than inheriting", () => {
        const heading = rules(globals).find(([sel]) => sel.endsWith("h6") && sel.includes("h1"));
        expect(heading?.[1]).toContain("font-weight: var(--fw-normal)");
    });
});

describe("leading", () => {
    test("display leading leaves room for descenders on a wrapping title", () => {
        expect(Number(token("--lh-display"))).toBeGreaterThanOrEqual(1.1);
    });

    test("leading loosens as type gets smaller", () => {
        expect(Number(token("--lh-display"))).toBeLessThan(Number(token("--lh-tight")));
        expect(Number(token("--lh-tight"))).toBeLessThan(Number(token("--lh-normal")));
        expect(Number(token("--lh-normal"))).toBeLessThan(Number(token("--lh-relaxed")));
    });
});
