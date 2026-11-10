import { afterEach, describe, expect, test } from "bun:test";
import { IMG_WIDTHS } from "../src/app-api";
import { snapWidth } from "../src/routes/app";
import { renderKey, seriesKeyFor, withSeriesKey } from "../src/lib/render-key";
import { appIndex, noteTitle, resolveAppRoute } from "../src/lib/app-route";
import { seriesTags } from "../src/lib/cache";
import { API_OPERATIONS } from "../src/lib/agent-surface";
import { toAppGlassPick } from "../src/lib/app-route";
import type { GlassPick } from "../src/lib/glass";
import { renderRoute } from "../src/lib/ssr";
import { STATIC_PAGES } from "../src/pages/static";
import { collection, entry, post, restoreFetch, serveFarfield } from "./farfield-stub";

afterEach(restoreFetch);

const SERIES_BODY = "![left](blob://bafyappone)\n\n![right](blob://bafyapptwo)";

function site() {
    return serveFarfield({
        collections: [collection("posts", "Posts"), collection("art", "Art", "Pictures"), collection("recipes", "Recipes")],
        entries: [
            entry({
                collection: "posts",
                slug: "1700000000000-alpha",
                cid: "bafyappalpha",
                title: "Alpha",
                body: "Alpha **body** text.",
                tags: ["wood"],
                publishedAt: "2026-03-01T00:00:00Z",
                updatedAt: "2026-03-02T00:00:00Z",
            }),
            entry({
                collection: "posts",
                slug: "beta",
                cid: "bafyappbeta",
                title: "Beta",
                excerpt: "  Beta lede  ",
                body: "Beta body.",
                tags: ["wood", "oak"],
                publishedAt: "2026-02-01T00:00:00Z",
            }),
            entry({
                collection: "art",
                slug: "gamma",
                cid: "bafyappgamma",
                title: "Gamma",
                body: "![](series://drift)",
                tags: ["oak"],
                publishedAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-05T00:00:00Z",
            }),
            entry({ collection: "posts", slug: "hidden", cid: "bafyapphidden", published: false, publishedAt: "2026-05-01T00:00:00Z" }),
        ],
        series: [{ slug: "drift", cid: "bafyappdrift", title: " Drift ", body: SERIES_BODY, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }],
        blobs: [{ cid: "bafyappone", size: 10, mime: "image/jpeg", width: 1200, height: 800, blurhash: "LKO2" }],
        posts: [
            post({ slug: "p3", cid: "bafyappp3", body: "Third note. More after.", createdAt: "2026-04-03T00:00:00Z" }),
            post({ slug: "p2", cid: "bafyappp2", body: "![](blob://bafyappone)", createdAt: "2026-04-02T00:00:00Z" }),
            post({ slug: "p1", cid: "bafyappp1", body: "First", createdAt: "2026-04-01T00:00:00Z" }),
            post({ slug: "p0", cid: "bafyappp0", body: "see ![](series://drift)", createdAt: "2026-03-31T00:00:00Z" }),
        ],
    });
}

describe("appIndex", () => {
    test("lists sections with content, published documents newest first, and every note", async () => {
        site();
        const index = await appIndex();
        expect(index.sections).toEqual([
            { slug: "posts", name: "Posts", description: null, count: 2 },
            { slug: "art", name: "Art", description: "Pictures", count: 1 },
        ]);
        expect(index.items.map((i) => [i.href, i.excerpt, i.tags])).toEqual([
            ["/posts/1700000000000-alpha", "Alpha body text.", ["wood"]],
            ["/posts/beta", "Beta lede", ["wood", "oak"]],
            ["/art/gamma", "", ["oak"]],
        ]);
        expect(index.feed).toEqual([
            { rkey: "p3", href: "/feed/p3", excerpt: "Third note. More after.", createdAt: "2026-04-03T00:00:00Z" },
            { rkey: "p2", href: "/feed/p2", excerpt: "", createdAt: "2026-04-02T00:00:00Z" },
            { rkey: "p1", href: "/feed/p1", excerpt: "First", createdAt: "2026-04-01T00:00:00Z" },
            { rkey: "p0", href: "/feed/p0", excerpt: "see", createdAt: "2026-03-31T00:00:00Z" },
        ]);
        expect(index.latestFeed.map((p) => [p.rkey, p.renderKey])).toEqual([
            ["p3", "bafyappp3"],
            ["p2", "bafyappp2"],
            ["p1", "bafyappp1"],
        ]);
        expect(index.latestFeed[1].media).toEqual({
            bafyappone: { mime: "image/jpeg", width: 1200, height: 800, dominantColor: null, blurhash: "LKO2", thumbCid: null },
        });
        expect(index.menu.map((g) => g.group)).toEqual(["", "publications", "archive", "personal", "other"]);
        expect(index.menu[0].links).toEqual([{ label: "home", href: "/" }]);
        expect(index.menu[1].links).toEqual([
            { label: "posts", href: "/posts" },
            { label: "art", href: "/art" },
        ]);
        expect(index.glassPick).toBeNull();
        expect(index.intro).toBe("Hi, I am Matthias.\n\nThis is my cozy corner on the web. A collection of photographs, projects, recipes, and notes.");
    });
});

describe("resolveAppRoute", () => {
    test("a document that embeds a series carries its media, its series and a fingerprinted render key", async () => {
        site();
        const route = await resolveAppRoute("/art/gamma");
        if (route.kind !== "doc") throw new Error(`got ${route.kind}`);
        expect(route.doc.renderKey).toBe("bafyappgamma@2026-01-01T00:00:00Z@2026-01-05T00:00:00Z@drift:bafyappdrift@Art|Pictures");
        expect(route.doc.description).toBe("");
        expect(route.doc.section).toEqual({ slug: "art", name: "Art" });
        expect(route.doc.series).toEqual({ drift: { title: "Drift", body: SERIES_BODY, layout: "grid" } });
        expect(route.doc.media).toEqual({
            bafyappone: { mime: "image/jpeg", width: 1200, height: 800, dominantColor: null, blurhash: "LKO2", thumbCid: null },
            bafyapptwo: { mime: "application/octet-stream", width: null, height: null, dominantColor: null, blurhash: null, thumbCid: null },
        });
        expect(route.doc.prev).toBeUndefined();
        expect(route.doc.next).toBeUndefined();
    });

    test("an older document links its newer sibling and its related documents", async () => {
        site();
        const route = await resolveAppRoute("/posts/beta");
        if (route.kind !== "doc") throw new Error(`got ${route.kind}`);
        expect(route.doc.description).toBe("Beta lede");
        expect(route.doc.renderKey).toBe("bafyappbeta@2026-02-01T00:00:00Z@2025-01-02T00:00:00Z@Posts|");
        expect(route.doc.next).toEqual({ title: "Alpha", href: "/posts/1700000000000-alpha" });
        expect(route.doc.prev).toBeUndefined();
        expect(route.doc.related.map((r) => r.href).sort()).toEqual(["/art/gamma", "/posts/1700000000000-alpha"]);
    });

    test("an unstamped slug redirects to its stamped document, and a trailing slash is dropped", async () => {
        site();
        expect(await resolveAppRoute("/posts/alpha")).toEqual({ kind: "redirect", to: "/posts/1700000000000-alpha", status: 301 });
        expect(await resolveAppRoute("/posts/", "?x=1")).toEqual({ kind: "redirect", to: "/posts?x=1", status: 301 });
    });

    test("drafts, unknown sections and pages past the end are not found", async () => {
        site();
        expect(await resolveAppRoute("/posts/hidden")).toEqual({ kind: "notfound" });
        expect(await resolveAppRoute("/nowhere")).toEqual({ kind: "notfound" });
        expect(await resolveAppRoute("/posts/page/2")).toEqual({ kind: "notfound" });
        expect(await resolveAppRoute("/feed/nope")).toEqual({ kind: "notfound" });
    });

    test("a section lists its own published documents", async () => {
        site();
        const route = await resolveAppRoute("/posts");
        if (route.kind !== "list") throw new Error(`got ${route.kind}`);
        expect(route.section).toEqual({ slug: "posts", name: "Posts", description: null, count: 2 });
        expect([route.page, route.pages]).toEqual([1, 1]);
        expect(route.items.map((i) => i.title)).toEqual(["Alpha", "Beta"]);
    });

    test("the feed pages every note, and a note that embeds a series keys its render on it", async () => {
        site();
        const route = await resolveAppRoute("/feed");
        if (route.kind !== "feed") throw new Error(`got ${route.kind}`);
        expect([route.page, route.pages, route.total]).toEqual([1, 1, 4]);
        expect(route.posts.map((p) => [p.rkey, p.renderKey])).toEqual([
            ["p3", "bafyappp3"],
            ["p2", "bafyappp2"],
            ["p1", "bafyappp1"],
            ["p0", "bafyappp0@drift:bafyappdrift"],
        ]);
        expect(Object.keys(route.posts[3].media)).toEqual(["bafyappone", "bafyapptwo"]);
    });

    test("one note resolves to its post", async () => {
        site();
        const route = await resolveAppRoute("/feed/p1");
        if (route.kind !== "post") throw new Error(`got ${route.kind}`);
        expect(route.post).toEqual({
            rkey: "p1",
            cid: "bafyappp1",
            renderKey: "bafyappp1",
            href: "/feed/p1",
            body: "First",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            tags: [],
            media: {},
            series: {},
        });
    });

    test("tags are counted across published documents, most used first, then by name", async () => {
        site();
        expect(await resolveAppRoute("/tags")).toEqual({
            kind: "tags",
            tags: [
                { tag: "oak", count: 2 },
                { tag: "wood", count: 2 },
            ],
            total: 2,
        });
        const oak = await resolveAppRoute("/tags/oak");
        if (oak.kind !== "tag") throw new Error(`got ${oak.kind}`);
        expect(oak.items.map((i) => i.href)).toEqual(["/posts/beta", "/art/gamma"]);
    });

    test("content counts every publication, empty ones included", async () => {
        site();
        const route = await resolveAppRoute("/content");
        if (route.kind !== "content") throw new Error(`got ${route.kind}`);
        expect(route.total).toBe(3);
        expect(route.sections).toEqual([
            { slug: "posts", name: "Posts", count: 2 },
            { slug: "art", name: "Art", count: 1 },
            { slug: "recipes", name: "Recipes", count: 0 },
        ]);
    });

    test("now carries the newest notes", async () => {
        site();
        const route = await resolveAppRoute("/now");
        if (route.kind !== "now") throw new Error(`got ${route.kind}`);
        expect(route.title).toBe("Now");
        expect(route.recent.map((p) => p.rkey)).toEqual(["p3", "p2", "p1", "p0"]);
        expect(route.working).toContain("[recipes](/recipes)");
    });

    test("resume and developers are built from the hand-written pages", async () => {
        site();
        const resume = await resolveAppRoute("/resume");
        if (resume.kind !== "resume") throw new Error(`got ${resume.kind}`);
        expect(resume.sections.map((s) => s.title)).toEqual(["Present", "Historic", "Education"]);
        expect(resume.sections[0].entries[0]).toEqual({ company: "Stablecore", date: "2026 → Current", position: "Solutions Engineer" });
        const developers = await resolveAppRoute("/developers");
        if (developers.kind !== "developers") throw new Error(`got ${developers.kind}`);
        expect(developers.markdownHref).toBe("/developers.md");
        expect(developers.quickstart.startsWith("# Search the site")).toBe(true);
        expect(developers.endpoints[0]).toEqual({
            label: `GET ${API_OPERATIONS[0].path}`,
            href: API_OPERATIONS[0].path,
            description: API_OPERATIONS[0].description,
        });
        expect(developers.sections.map((s) => s.title)).toEqual([
            "HTTP endpoints",
            "MCP server",
            "Markdown twins",
            "Versioning",
            "Everything else",
            "Caching and etiquette",
            "FAQ",
        ]);
    });
});

describe("renderKey (com/src/lib/render-key.ts)", () => {
    const doc = {
        cid: "bafy",
        publishedAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        publication: { name: "Art", description: "Pictures" },
    };
    const body = "intro\n\n![](series://datamosh)\n";

    test("a series edit changes the key while the entry cid stays put", () => {
        const before = renderKey({ ...doc, seriesKey: seriesKeyFor(body, new Map([["datamosh", "cid-a"]])) });
        const after = renderKey({ ...doc, seriesKey: seriesKeyFor(body, new Map([["datamosh", "cid-b"]])) });
        expect(before).toBe("bafy@2026-01-01T00:00:00Z@2026-01-02T00:00:00Z@datamosh:cid-a@Art|Pictures");
        expect(after).not.toBe(before);
    });

    test("no series: no fingerprint segment", () => {
        expect(renderKey({ ...doc, seriesKey: "" })).toBe("bafy@2026-01-01T00:00:00Z@2026-01-02T00:00:00Z@Art|Pictures");
    });

    test("posts use com's feed renderId", () => {
        expect(withSeriesKey("bafy", "")).toBe("bafy");
        expect(withSeriesKey("bafy", "datamosh:cid-a")).toBe("bafy@datamosh:cid-a");
    });

    test("feed payloads that embed a series carry the documents purge tag", () => {
        expect(seriesTags([{ body: "just text" }])).toEqual([]);
        expect(seriesTags([{ body: "x" }, { body: body }])).toEqual(["documents"]);
    });
});

describe("SSR for the hand-written kinds keeps the page's head", () => {
    test("resume renders com's <dl> per section", async () => {
        const page = await renderRoute(await resolveAppRoute("/resume", "", { redirects: false }), "/resume");
        expect(page.head.title).toBe(STATIC_PAGES.resume.title);
        expect(page.head.ogImage).toBe("/resume");
        expect(page.main).toContain(`<h2 id="historic">Historic</h2><dl>`);
        expect(page.main).toContain(
            `<div class="entry"><dt>Stablecore</dt><dd class="date">2026 → Current</dd><dd class="position">Solutions Engineer</dd></div>`,
        );
        expect(page.main.match(/<dl>/g)?.length).toBe(3);
    });

    test("developers renders quickstart, endpoints, then every section", async () => {
        const route = await resolveAppRoute("/developers", "", { redirects: false });
        if (route.kind !== "developers") throw new Error(`got ${route.kind}`);
        const page = await renderRoute(route, "/developers");
        expect(page.head.markdownHref).toBe("/developers.md");
        expect(page.head.faq).toBe(STATIC_PAGES.developers.faq);
        expect(page.main).toContain(`<h1>iammatthias.com developer documentation</h1>`);
        expect(page.main).toContain(`<dt><code>GET ${API_OPERATIONS[0].path}</code></dt>`);
        expect(page.main).toContain("openapi.json");
        for (const s of route.sections) expect(page.main).toContain(`>${s.title}</h2>`);
        expect(page.main.indexOf(">Quickstart</h2>")).toBeLessThan(page.main.indexOf(">MCP server</h2>"));
    });
});

describe("glassPick (com GlassArch)", () => {
    const pick: GlassPick = {
        src: "https://wsrv.nl/?url=x&w=960",
        srcset: "",
        sizes: "",
        width: 1080,
        height: 1620,
        alt: "Big Trees",
        description: null,
        prominentColor: "#a38553",
        seriesTitle: "Big Trees",
        shareUrl: null,
        equipment: "Canon EOS R",
        settings: null,
        captureDate: "June 23, 2026",
    };

    test("maps to the app shape, dropping empty caption lines", () => {
        expect(toAppGlassPick(pick)).toEqual({
            href: "https://glass.photo/iam",
            image: "https://wsrv.nl/?url=x&w=960",
            width: 1080,
            height: 1620,
            prominentColor: "#a38553",
            caption: { series: "Big Trees", equipment: "Canon EOS R", date: "June 23, 2026" },
        });
    });

    test("links the post when Glass has a share url, and carries its description", () => {
        const out = toAppGlassPick({ ...pick, shareUrl: "https://glass.photo/iam/abc", description: "Redwoods" })!;
        expect(out.href).toBe("https://glass.photo/iam/abc");
        expect(out.caption.title).toBe("Redwoods");
        expect(toAppGlassPick(null)).toBeNull();
    });
});

describe("/img width presets", () => {
    test("snaps up to the next preset and caps at the largest", () => {
        expect(snapWidth("700")).toBe(720);
        expect(snapWidth("720")).toBe(720);
        expect(snapWidth("1")).toBe(IMG_WIDTHS[0]);
        expect(snapWidth("99999")).toBe(2560);
        expect(snapWidth(null)).toBe(1920);
        expect(snapWidth("abc")).toBe(1920);
    });
});

describe("timeline note titles", () => {
    test("a picture alone is named by its date", () => {
        expect(noteTitle("![](blob://x)", "2026-10-09T15:31:11Z")).toBe("Photograph, 9 Oct 2026");
    });
    test("a note is its first sentence, or its first words", () => {
        expect(noteTitle("California skies are hard to beat. More words follow here.", "2026-01-01T00:00:00Z")).toBe("California skies are hard to beat");
        const long = noteTitle("Once upon a time, in the long long ago of the early internet, there were forums", "2026-01-01T00:00:00Z");
        expect(long.endsWith("…")).toBe(true);
        expect(long.length).toBeLessThanOrEqual(45);
    });
});
