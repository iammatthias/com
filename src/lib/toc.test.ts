import { describe, expect, test } from "bun:test";
import { buildToc, readingTime } from "./toc";

describe("buildToc", () => {
    const html = [
        "<h2>Hello, World!</h2><p>x</p>",
        "<h2>Hello, World!</h2>",
        "<h3>A &amp; <em>B</em></h3>",
        '<h2 id="keep">Kept</h2>',
        '<h2 class="ff-recipe-title">Skip</h2>',
    ].join("");

    const { html: out, entries } = buildToc(html);

    test("collects h2/h3 entries with decoded, tag-free text", () => {
        expect(entries).toEqual([
            { id: "hello-world", text: "Hello, World!", level: 2 },
            { id: "hello-world-2", text: "Hello, World!", level: 2 },
            { id: "a-b", text: "A & B", level: 3 },
            { id: "keep", text: "Kept", level: 2 },
        ]);
    });

    test("assigns ids to headings that lack one and leaves existing ids alone", () => {
        expect(out).toContain('<h2 id="hello-world">Hello, World!</h2>');
        expect(out).toContain('<h2 id="hello-world-2">Hello, World!</h2>');
        expect(out).toContain('<h3 id="a-b">A &amp; <em>B</em></h3>');
        expect(out).toContain('<h2 id="keep">Kept</h2>');
    });

    test("recipe headings are neither indexed nor given ids", () => {
        expect(out).toContain('<h2 class="ff-recipe-title">Skip</h2>');
        expect(entries.some((e) => e.text === "Skip")).toBe(false);
    });

    test("ids are capped at sixty characters and never empty", () => {
        const long = "w".repeat(80);
        expect(buildToc(`<h2>${long}</h2>`).entries[0].id).toBe("w".repeat(60));
        expect(buildToc("<h2></h2>").entries[0].id).toBe("section");
    });
});

describe("readingTime", () => {
    test("is zero for nothing and grows with the body", () => {
        expect(readingTime(undefined).minutes).toBe(0);
        expect(readingTime("").minutes).toBe(0);
        const short = readingTime("word ".repeat(150)).minutes;
        const long = readingTime("word ".repeat(1500)).minutes;
        expect(short).toBeGreaterThan(0);
        expect(long).toBeGreaterThan(short);
    });
});
