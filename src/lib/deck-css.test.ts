import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/deck.css", import.meta.url), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
);

type Block = { head: string; rules: Map<string, string> };

function parseTopLevel(src: string): Block[] {
    const blocks: Block[] = [];
    let depth = 0;
    let buf = "";
    let atHead = "";
    let inner = "";
    for (const ch of src) {
        if (ch === "{") {
            depth++;
            if (depth === 1) {
                atHead = buf.trim().split("\n").pop()!.trim();
                buf = "";
                inner = "";
                continue;
            }
        } else if (ch === "}") {
            depth--;
            if (depth === 0) {
                blocks.push({ head: atHead, rules: parseRules(atHead.startsWith("@") ? inner : `${atHead}{${inner}}`) });
                buf = "";
                continue;
            }
        }
        if (depth === 0) buf += ch;
        else inner += ch;
    }
    return blocks;
}

function parseRules(src: string): Map<string, string> {
    const rules = new Map<string, string>();
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        for (const sel of m[1].split(",")) rules.set(sel.trim().replace(/\s+/g, " "), m[2]);
    }
    return rules;
}

const blocks = parseTopLevel(css);
const byHead = (head: string) => blocks.filter((b) => b.head === head);
const desktop = byHead("@media (min-width: 1200px)");
const has = (bs: Block[], sel: string) => bs.some((b) => b.rules.has(sel));
const decl = (bs: Block[], sel: string) => bs.map((b) => b.rules.get(sel)).find(Boolean) ?? "";

describe("deck.css structure", () => {
    test("braces balance and every top-level block has a head", () => {
        expect(css.split("{").length).toBe(css.split("}").length);
        expect(blocks.every((b) => b.head.length > 0)).toBe(true);
    });

    test("the deck shell rules live under the desktop media query", () => {
        for (const sel of [
            "body[data-deck]",
            ".deck",
            ".deck-col",
            ".deck-col--rail",
            ".deck-col--main",
            ".deck-col__head",
            ".deck-col__body",
            ".rail-brand",
            ".rail-tools",
            ".rail-toggle",
        ]) {
            expect(has(desktop, sel)).toBe(true);
        }
        expect(decl(desktop, ".deck-col__head")).toContain("grid-template-columns: auto minmax(0, 1fr) auto");
        expect(decl(desktop, "body[data-deck]")).toContain("padding: var(--page-inset)");
    });

    test("size limits contain only nth-child rules, and both lists each", () => {
        for (const head of ["@media (max-height: 820px)", "@container deck-col (max-width: 360px)"]) {
            const bs = byHead(head);
            expect(bs.length).toBe(1);
            const sels = [...bs[0].rules.keys()];
            expect(sels.length).toBe(2);
            expect(sels.every((s) => s.includes(":nth-child("))).toBe(true);
            expect(sels.some((s) => s.startsWith(".deck-peek > li"))).toBe(true);
            expect(sels.some((s) => s.startsWith(".deck-col--peek .feed > li"))).toBe(true);
        }
    });

    test("retired selectors are gone", () => {
        expect(css).not.toContain("deck-controls");
        expect(css).not.toContain("deck-col--identity");
        expect(css).not.toContain(":global(");
    });
});
