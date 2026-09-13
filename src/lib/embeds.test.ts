import { describe, expect, test } from "bun:test";
import { extractBodyEmbeds, fullEmbedRe } from "./embeds";

const BODY = [
    "Intro ![Alt text](blob://bafyabc123) mid",
    "![](series://my-series) tail",
    "![plain](https://example.com/y.png)",
].join("\n");

describe("extractBodyEmbeds", () => {
    test("finds blob and series embeds with their alt text, in order", () => {
        expect(extractBodyEmbeds(BODY)).toEqual([
            { alt: "Alt text", scheme: "blob", id: "bafyabc123" },
            { alt: "", scheme: "series", id: "my-series" },
        ]);
    });

    test("ignores ordinary images and non-farfield schemes", () => {
        expect(extractBodyEmbeds("![x](https://a/b.png) ![y](ipfs://abc)")).toEqual(
            [],
        );
    });

    test("ids are lowercase alphanumerics and hyphens only", () => {
        expect(extractBodyEmbeds("![a](blob://Not_Valid)")).toEqual([]);
    });
});

describe("fullEmbedRe", () => {
    test("returns a fresh global regex each call, so matchAll never sees a stale lastIndex", () => {
        expect([...BODY.matchAll(fullEmbedRe())]).toHaveLength(2);
        expect([...BODY.matchAll(fullEmbedRe())]).toHaveLength(2);
    });
});
