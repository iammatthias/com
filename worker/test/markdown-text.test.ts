import { describe, expect, test } from "bun:test";
import { plainText, proseHtml } from "../src/lib/markdown-text";

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

    test("tables read as their cells, without pipes or divider rows", () => {
        const md = "| Metric | Value |\n|---|:--:|\n| Rows | 365 |\n\nAfter.";
        expect(plainText(md)).toBe("Metric Value Rows 365 After.");
    });

    test("a thematic break and a pipe mid-sentence are left alone", () => {
        expect(plainText("one | two\n\n---\n\nthree")).toBe("one | two --- three");
    });
});

describe("proseHtml", () => {
    test("embeds render where they were written", () => {
        const body = "![](blob://bafkimg)\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nAfter.";
        const html = proseHtml(body, ["<figure>IMG</figure>"]);
        expect(html.indexOf("<figure>IMG</figure>")).toBe(0);
        expect(html.indexOf("<figure>")).toBeLessThan(html.indexOf("<table>"));
        expect(html.indexOf("<table>")).toBeLessThan(html.indexOf("<p>After.</p>"));
        expect(html).not.toContain("<p><figure>");
    });

    test("an embed mid-paragraph stays between its words", () => {
        expect(proseHtml("before ![x](blob://bafk) after", ["[F]"])).toBe("<p>before [F] after</p>");
    });

    test("unresolved embeds drop out", () => {
        expect(proseHtml("![](blob://bafk)")).toBe("");
    });
});
