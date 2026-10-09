import { describe, expect, test } from "bun:test";
import type { DocumentData } from "./farfield-loader";
import { relatedDocs } from "./related";

function doc(rkey: string, tags: string[], publishedAt: string, extra: Partial<DocumentData> = {}): DocumentData {
    return { collection: "posts", rkey, tags, publishedAt, published: true, ...extra } as DocumentData;
}

const self = doc("self", ["cloudflare", "astro"], "2026-05-01");
const both = doc("both", ["astro", "cloudflare"], "2026-01-01");
const oneNew = doc("one-new", ["astro"], "2026-04-01");
const oneOld = doc("one-old", ["cloudflare"], "2026-02-01");
const none = doc("none", ["pizza"], "2026-09-01");
const draft = doc("draft", ["cloudflare", "astro"], "2026-08-01", { published: false });
const sameSlugOtherSection = doc("self", ["cloudflare"], "2026-03-01", { collection: "art" });

describe("relatedDocs", () => {
    const all = [none, oneOld, draft, self, oneNew, sameSlugOtherSection, both];

    test("ranks by shared tags, then newest, never itself or a draft", () => {
        expect(relatedDocs(self, all).map((d) => `${d.collection}/${d.rkey}`)).toEqual([
            "posts/both",
            "posts/one-new",
            "art/self",
            "posts/one-old",
            "posts/none",
        ]);
    });

    test("stops at n", () => {
        expect(relatedDocs(self, all, 2).map((d) => d.rkey)).toEqual(["both", "one-new"]);
    });
});
