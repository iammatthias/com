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
        for (const raw of m[1].split(",")) {
            const sel = raw.trim().replace(/\s+/g, " ");
            rules.set(sel, (rules.get(sel) ?? "") + m[2]);
        }
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
            ".deck-col--meta",
            ".deck-col--main",
            ".deck-col__head",
            ".deck-col__body",
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

    test("the deck never scrolls sideways", () => {
        const deck = decl(desktop, ".deck");
        expect(deck).not.toContain("overflow-x: auto");
        expect(deck).not.toContain("overflow-x: scroll");
        expect(css).not.toContain("scroll-padding-left");
    });

    test("the document scrolls; only the sidebars may scroll themselves", () => {
        const body = decl(desktop, "body[data-deck]");
        expect(body).toContain("min-height: 100dvh");
        expect(body).not.toContain("overflow: hidden");
        expect(decl(desktop, ".deck-col__body")).not.toContain("overflow-y: auto");
        expect(
            decl(desktop, ".deck-col--meta > .deck-col__body"),
        ).toContain("overflow-y: auto");
    });

    test("the one sidebar sticks rather than being a fixed pane", () => {
        expect(decl(desktop, ".deck-col--meta")).toContain("position: sticky");
    });

    test("no width band swaps one layout for another", () => {
        const switches = blocks.filter(
            (b) => /max-width: 1[5-9]\d\dpx|min-width: [2-9]\d\d\dpx/.test(b.head),
        );
        expect(switches.map((b) => b.head)).toEqual([]);
    });

    test("the details column is never blanket-hidden with the peek columns", () => {
        const hidesPeek = blocks.filter((b) =>
            [...b.rules.entries()].some(
                ([sel, body]) => sel === ".deck-col--peek" && /display:\s*none/.test(body),
            ),
        );
        for (const b of hidesPeek) {
            expect([...b.rules.keys()]).not.toContain(".deck-col--meta");
        }
        expect(css).toContain(".deck-col--meta");
    });

    test("the deck has no exterior frame; separators sit between columns only", () => {
        const deck = decl(desktop, ".deck");
        expect(deck).not.toContain("border-top");
        expect(deck).not.toContain("border-left");
        expect(decl(desktop, ".deck-col")).toContain("border-left");
        expect(decl(desktop, ".deck-col")).not.toContain("border-right");
    });

    test("article bodies are a single reading column", () => {
        expect(css).not.toContain("column-count");
        expect(css).not.toContain("column-rule");
    });

    test("retired selectors are gone", () => {
        expect(css).not.toContain("deck-controls");
        expect(css).not.toContain("deck-col--identity");
        expect(css).not.toContain("deck-tags");
        expect(css).not.toContain("rail-");
        expect(css).not.toContain("deck-col__close");
        expect(css).not.toContain("scroll-snap");
        expect(css).not.toContain(":global(");
    });
});
