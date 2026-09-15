import { describe, expect, test } from "bun:test";
import { noteTitle, plainText } from "./markdown-text";

describe("plainText", () => {
    test("drops embeds and markup, keeps link text, collapses whitespace", () => {
        const md =
            "# Title\n\nSome **bold** and [a link](https://x) ![img](blob://abc) `code`.";
        expect(plainText(md)).toBe("Title Some bold and a link code.");
    });

    test("emphasis markers vanish without leaving a space before punctuation", () => {
        expect(plainText("Hello *world*, and _more_.")).toBe(
            "Hello world, and more.",
        );
    });

    test("blockquote and heading markers become word breaks", () => {
        expect(plainText("> quoted\n## Heading")).toBe("quoted Heading");
    });
});

describe("noteTitle", () => {
    test("takes the first readable line, past any leading embed", () => {
        expect(noteTitle("![](blob://abc)\n\nHello *world*, a note.\nSecond")).toBe(
            "Hello world, a note.",
        );
    });

    test("truncates at the limit and trims before the ellipsis", () => {
        expect(noteTitle("x".repeat(80))).toBe(`${"x".repeat(60)}…`);
        expect(noteTitle(`${"y".repeat(61)} zzz`, 20)).toBe(`${"y".repeat(20)}…`);
    });

    test("falls back to a label when nothing readable remains", () => {
        expect(noteTitle("")).toBe("Note");
        expect(noteTitle("![](blob://x)")).toBe("Note");
    });
});
