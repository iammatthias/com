import { describe, expect, test } from "bun:test";
import { composeDocumentMarkdown, composeFeedEntryMarkdown } from "../src/lib/markdown-view";
import type { DocumentData, FeedEntryData } from "../src/lib/farfield-loader";

const origin = "https://iammatthias.com";

const doc: DocumentData = {
    collection: "posts",
    rkey: "1779066375000-farfield",
    cid: "bafkreiexample",
    title: 'Farfield: "a homelab"',
    description: "Go apps and an Arch-based OS.",
    published: true,
    href: "/posts/1779066375000-farfield",
    publishedAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-05-19T00:00:00Z",
    publication: { slug: "posts", name: "Posts" },
    tags: ["homelab", "go"],
    body: "Body text.",
};

function frontMatter(md: string): Record<string, string> {
    const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
    if (!m) throw new Error("no front matter");
    return Object.fromEntries(
        m[1].split("\n").map((l) => {
            const i = l.indexOf(": ");
            return [l.slice(0, i), l.slice(i + 2)];
        }),
    );
}

describe("markdown twin front matter", () => {
    test("documents carry title, section, dates, tags, cid and the canonical html URL", () => {
        const md = composeDocumentMarkdown(doc, "Body text.", origin, [
            { title: "Other", href: "/posts/1-other", description: "x" },
        ]);
        const fm = frontMatter(md);
        expect(JSON.parse(fm.title)).toBe('Farfield: "a homelab"');
        expect(fm.section).toBe("posts");
        expect(JSON.parse(fm.description)).toBe("Go apps and an Arch-based OS.");
        expect(fm.tags).toBe('["homelab", "go"]');
        expect(fm.published).toBe("2026-05-18T00:00:00Z");
        expect(fm.updated).toBe("2026-05-19T00:00:00Z");
        expect(fm.cid).toBe("bafkreiexample");
        expect(fm.html).toBe(`${origin}/posts/1779066375000-farfield`);
        expect(md).toContain(`\n# Farfield: "a homelab"\n\nBody text.\n`);
        expect(md).toContain(`- [Other](${origin}/posts/1-other.md): x`);
    });

    test("empty description and tags are omitted, not emitted blank", () => {
        const fm = frontMatter(composeDocumentMarkdown({ ...doc, description: "", tags: [] }, "", origin));
        expect("description" in fm).toBe(false);
        expect("tags" in fm).toBe(false);
    });

    test("feed posts point at /feed/<rkey>", () => {
        const item: FeedEntryData = {
            rkey: "1hmyfx9dfq",
            cid: "bafkreipost",
            body: "hello",
            tags: [],
            createdAt: "2026-10-09T15:31:11Z",
            updatedAt: "2026-10-09T15:31:11Z",
        };
        const fm = frontMatter(composeFeedEntryMarkdown(item, "hello", origin));
        expect(fm.section).toBe("feed");
        expect(fm.created).toBe("2026-10-09T15:31:11Z");
        expect(fm.html).toBe(`${origin}/feed/1hmyfx9dfq`);
    });
});
