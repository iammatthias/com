import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { withLettrine } from "./azulejo-cap";

const golden = JSON.parse(
    readFileSync(new URL("./__fixtures__/azulejo-cap.golden.json", import.meta.url), "utf8"),
) as Array<{ s: number; html: string }>;

const BODY =
    "<p>Hello world, a test paragraph long enough to carry a drop cap.</p><p>Second.</p>";

describe("withLettrine reproduces the captured drop caps", () => {
    test("every golden seed renders byte-identically", () => {
        for (const { s, html } of golden) {
            expect(withLettrine(BODY, s)).toBe(html);
        }
    });

    test("the same seed always draws the same cap", () => {
        for (const { s } of golden) {
            expect(withLettrine(BODY, s)).toBe(withLettrine(BODY, s));
        }
    });

    test("different seeds draw different caps", () => {
        const shapes = new Set(golden.map(({ s }) => withLettrine(BODY, s)));
        expect(shapes.size).toBe(golden.length);
    });
});

describe("withLettrine as a body transform", () => {
    test("emits one cap and keeps the prose", () => {
        const out = withLettrine(BODY, 42);
        expect(out).toContain("Second.");
        expect(out.match(/<svg/g) ?? []).toHaveLength(1);
    });

    test("colours come from CSS variables, so the cap follows the theme", () => {
        const out = withLettrine(BODY, 7);
        expect(out).toContain("var(--cap-");
        expect(out).not.toMatch(/fill="#[0-9a-f]{6}"/i);
    });

    test("leaves a body it cannot cap untouched", () => {
        for (const body of ["", "<p></p>", "<figure><img src='x'></figure>"]) {
            expect(() => withLettrine(body, 1)).not.toThrow();
        }
    });

    test("produces well-formed markup", () => {
        const out = withLettrine(BODY, 12345);
        expect(out.split("<svg").length).toBe(out.split("</svg>").length);
        expect(out).not.toContain("undefined");
        expect(out).not.toContain("NaN");
    });
});
