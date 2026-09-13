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
    test("takes the first non-empty line after leading embeds, as plain text", () => {
        const md = "![](blob://abc)\n\nHello *world*, this is a note.\nSecond line";
        expect(noteTitle(md)).toBe("Hello world, this is a note.");
    });

    test("truncates long lines at the limit with an ellipsis", () => {
        const long = "x".repeat(120);
        expect(noteTitle(long)).toBe(`${"x".repeat(90)}…`);
        expect(noteTitle(long, 10)).toBe("xxxxxxxxxx…");
    });

    test("trims trailing whitespace before the ellipsis", () => {
        const line = `${"y".repeat(89)} ${"z".repeat(20)}`;
        expect(noteTitle(line)).toBe(`${"y".repeat(89)}…`);
    });

    test("falls back to a label when nothing readable remains", () => {
        expect(noteTitle("")).toBe("Note");
        expect(noteTitle("![](blob://x)")).toBe("Note");
    });
});
