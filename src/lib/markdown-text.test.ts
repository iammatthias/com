import { describe, expect, test } from "bun:test";
import { plainText } from "./markdown-text";

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
