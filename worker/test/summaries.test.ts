import { afterEach, describe, expect, test } from "bun:test";
import worker from "../src/index";
import { appIndex, appTimeline, resolveAppRoute } from "../src/lib/app-route";
import { buildSearchCorpus } from "../src/lib/search-corpus";
import { feedIndexMarkdown } from "../src/lib/markdown-view";
import { loadAllDocuments, loadAllFeedEntries } from "../src/lib/farfield-loader";
import { renderRoute } from "../src/lib/ssr";
import { STATIC_PAGES } from "../src/pages/static";
import { collection, entry, post, restoreFetch, serveFarfield } from "./farfield-stub";

afterEach(restoreFetch);

const words = (from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => `word${String(from + i).padStart(5, "0")}`).join(" ");

const BODIES = {
    plain: "Hello [world](https://x.y). Second *line* here.",
    bracket: "Use [brackets] here.",
    table: "| a | b |\n|---|---|\n| 1 | 2 |\n\nAfter the table.",
    image: "![](blob://bafysumimg)",
    long: words(0, 30),
};
const KINDS = Object.keys(BODIES) as Array<keyof typeof BODIES>;

function world() {
    serveFarfield({
        collections: [collection("posts", "Posts")],
        entries: KINDS.map((k, i) =>
            entry({ collection: "posts", slug: `d-${k}`, cid: `bafysumd${k}`, title: `T ${k}`, body: BODIES[k], publishedAt: `2026-01-0${i + 1}T00:00:00Z` }),
        ),
        posts: KINDS.map((k, i) => post({ slug: `n-${k}`, cid: `bafysumn${k}`, body: BODIES[k], createdAt: `2026-03-0${5 - i}T00:00:00Z` })),
    });
}

describe("every surface names and summarises a body exactly as before", () => {
    test("timeline titles and the SSR post's title and description", async () => {
        world();
        const titles = (await appTimeline(1)).items.filter((i) => i.kind === "feed").map((i) => i.title);
        expect(titles).toEqual([
            "Hello world",
            "Use [brackets] here",
            "a b 1 2 After the table",
            "Photograph, 2 Mar 2026",
            "word00000 word00001 word00002 word00003…",
        ]);
        const heads = [];
        for (const k of KINDS) {
            const route = await resolveAppRoute(`/feed/n-${k}`, "", { redirects: false });
            const { head } = await renderRoute(route, `/feed/n-${k}`);
            heads.push([head.title, head.description]);
        }
        expect(heads).toEqual([
            ["Hello world", "Hello world. Second line here."],
            ["Use [brackets] here", "Use [brackets] here."],
            ["a b 1 2 After the table", "a b 1 2 After the table."],
            ["Photograph, 2 Mar 2026", "Feed entry."],
            ["word00000 word00001 word00002 word00003…", words(0, 18)],
        ]);
    });

    test("the app's feed excerpts and document excerpts and descriptions", async () => {
        world();
        const index = await appIndex();
        const plain = ["Hello world. Second line here.", "Use [brackets] here.", "a b 1 2 After the table.", ""];
        expect(index.feed.map((f) => f.excerpt)).toEqual([...plain, words(0, 20)]);
        expect(index.items.map((i) => i.excerpt)).toEqual([words(0, 20), "", ...plain.slice(0, 3).reverse()]);
        const descriptions = [];
        for (const k of KINDS) {
            const route = await resolveAppRoute(`/posts/d-${k}`, "", { redirects: false });
            if (route.kind !== "doc") throw new Error(`got ${route.kind}`);
            descriptions.push(route.doc.description);
        }
        expect(descriptions).toEqual([...plain, words(0, 18)]);
    });

    test("the search corpus", async () => {
        world();
        const corpus = buildSearchCorpus(await loadAllDocuments(), await loadAllFeedEntries());
        expect(corpus.map((c) => [c.href, c.title, c.text])).toEqual([
            ["/posts/d-long", "T long", `T long — ${BODIES.long}`],
            ["/posts/d-image", "T image", "T image"],
            ["/posts/d-table", "T table", "T table — a b 1 2 After the table."],
            ["/posts/d-bracket", "T bracket", "T bracket — Use [brackets] here."],
            ["/posts/d-plain", "T plain", "T plain — Hello world. Second line here."],
            ["/feed/n-plain", "Hello world. Second line here.", "Hello world. Second line here."],
            ["/feed/n-bracket", "Use [brackets] here.", "Use [brackets] here."],
            ["/feed/n-table", "a b 1 2 After the table.", "a b 1 2 After the table."],
            ["/feed/n-long", `${words(0, 8)} `, BODIES.long],
        ]);
    });

    test("feed.md links and now.md updates", async () => {
        world();
        expect(feedIndexMarkdown(await loadAllFeedEntries(), "https://o").split("\n").slice(4, 9)).toEqual([
            "- 2026-03-05 [Hello world. Second line here.](https://o/feed/n-plain.md)",
            "- 2026-03-04 [Use brackets here.](https://o/feed/n-bracket.md)",
            "- 2026-03-03 [a b 1 2 After the table.](https://o/feed/n-table.md)",
            "- 2026-03-02 [(media)](https://o/feed/n-image.md)",
            `- 2026-03-01 [${words(0, 10)}](https://o/feed/n-long.md)`,
        ]);
        const now = await STATIC_PAGES.now.markdown();
        expect(now).toContain(
            [
                "- [Mar 5, 2026](/feed/n-plain): Hello world. Second line here.",
                "- [Mar 4, 2026](/feed/n-bracket): Use [brackets] here.",
                "- [Mar 3, 2026](/feed/n-table): a b 1 2 After the table.",
                "- [Mar 2, 2026](/feed/n-image)",
                `- [Mar 1, 2026](/feed/n-long): ${words(0, 14)}`,
            ].join("\n"),
        );
    });

    test("the feed's RSS descriptions keep their untrimmed cut", async () => {
        world();
        const res = await worker.fetch(
            new Request("https://iammatthias.com/feed/rss.xml"),
            { ASSETS: { fetch: async () => new Response("asset") } } as never,
            { waitUntil() {}, passThroughOnException() {} } as never,
        );
        const xml = await res.text();
        const descriptions = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => /<description>([\s\S]*?)<\/description>/.exec(m[0])?.[1] ?? null);
        expect(descriptions).toEqual([
            "Hello world. Second line here.",
            "Use [brackets] here.",
            "a b 1 2 After the table.",
            null,
            `${words(0, 18)} `,
        ]);
    });
});
