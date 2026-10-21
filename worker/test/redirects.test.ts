import { describe, expect, test } from "bun:test";
import {
    agentModeRedirect,
    legacyRedirect,
    markdownTwin,
    MOVED_ENTRIES,
    redirectFor,
    renamedPublication,
    sameOriginPath,
    stampedRedirect,
    trailingSlashRedirect,
    type RedirectDeps,
} from "../src/lib/redirects";

const PUBS = new Set(["art", "posts", "recipes", "melange", "experiments"]);
const STAMPED: Record<string, string> = {
    "posts/farfield": "/posts/1779066375000-farfield",
};
const deps: RedirectDeps = {
    publications: async () => PUBS,
    stampedHref: async (pub, slug) => STAMPED[`${pub}/${slug}`] ?? null,
};
const publications = async () => PUBS;

describe("redirect table", () => {
    const cases: Array<[string, string, string | null, number?]> = [
        ["/posts/", "", "/posts"],
        ["/posts///", "?a=1", "/posts?a=1"],
        ["/", "", null],
        ["/open-source", "", "/experiments"],
        ["/open-source.md", "", "/experiments.md"],
        ["/open-source/anything-else", "?x=1", "/experiments?x=1"],
        ["/open-source/1768762943567-nimbus", "", "/experiments/1789491418000-atproto"],
        ["/open-source/1768762943567-nimbus.md", "", "/experiments/1789491418000-atproto.md"],
        ["/posts/farfield", "?q=1", "/posts/1779066375000-farfield?q=1"],
        ["/posts/farfield.md", "", "/posts/1779066375000-farfield.md"],
        ["/posts/1779066375000-farfield", "", null],
        ["/posts/not-a-known-slug", "", null],
        ["/feed/farfield", "", null],
        ["/post", "", "/content"],
        ["/post/some/old/path", "?q=1", "/content"],
        ["/content/foo", "", "/content"],
        ["/content/page", "", "/content"],
        ["/content/a/b", "", "/content"],
        ["/content/page/2", "", null],
        ["/content/page/abc", "", null],
        ["/content", "", null],
        ["/sitemap-index.xml", "", "/sitemap.xml"],
        ["/about", "", null],
    ];
    for (const [path, search, to] of cases) {
        test(`${path}${search} -> ${to ?? "no redirect"}`, async () => {
            const r = await redirectFor(path, search, "GET", deps);
            if (to === null) expect(r).toBeNull();
            else expect(r).toEqual({ to, status: 301 });
        });
    }

    test("every MOVED_ENTRIES source lands in experiments", () => {
        for (const [from, to] of Object.entries(MOVED_ENTRIES)) {
            expect(renamedPublication(from)).toBe(to);
            expect(to.startsWith("/experiments/")).toBe(true);
        }
    });

    test("trailing slash applies to every method, the rest only to reads", async () => {
        expect(await redirectFor("/mcp/", "", "POST", deps)).toEqual({ to: "/mcp", status: 301 });
        expect(await redirectFor("/open-source", "", "POST", deps)).toBeNull();
        expect(await redirectFor("/open-source", "", "HEAD", deps)).toEqual({ to: "/experiments", status: 301 });
    });

    test("a failing publication lookup never blocks the request", async () => {
        const broken: RedirectDeps = {
            publications: async () => {
                throw new Error("upstream down");
            },
            stampedHref: async () => null,
        };
        expect(await stampedRedirect("/posts/farfield", broken)).toBeNull();
    });

    test("pure helpers", () => {
        expect(trailingSlashRedirect("/a/")).toBe("/a");
        expect(trailingSlashRedirect("/a")).toBeNull();
        expect(legacyRedirect("/postcard")).toBeNull();
    });

    test("a leading slash run never becomes a protocol-relative Location", async () => {
        expect(trailingSlashRedirect("//example.com/")).toBe("/example.com");
        expect(trailingSlashRedirect("///example.com//")).toBe("/example.com");
        expect(await redirectFor("//example.com/", "?a=1", "GET", deps)).toEqual({ to: "/example.com?a=1", status: 301 });
    });

    test("sameOriginPath keeps site paths and refuses anywhere else", () => {
        expect(sameOriginPath("/posts?a=1#x")).toBe("/posts?a=1#x");
        expect(sameOriginPath("/experiments/1789490903000-obsidian-plugins.md")).toBe("/experiments/1789490903000-obsidian-plugins.md");
        expect(sameOriginPath("//example.com")).toBeNull();
        expect(sameOriginPath("/\\example.com/")).toBeNull();
        expect(sameOriginPath("https://example.com/")).toBeNull();
        expect(sameOriginPath("javascript:alert(1)")).toBeNull();
    });

    test("onchain analytics moved into a post, its sessions to fragments of it", () => {
        const post = "/experiments/1791937789859-onchain-analytics";
        const hash = "0x" + "AB".repeat(32);
        expect(legacyRedirect("/onchain-analytics")).toBe(post);
        expect(legacyRedirect("/onchain-analytics.md")).toBe(`${post}.md`);
        expect(legacyRedirect(`/onchain-analytics/${hash}`)).toBe(`${post}#${hash.toLowerCase()}`);
        expect(legacyRedirect("/onchain-analytics/0x1234")).toBeNull();
    });
});

describe("agent mode and markdown twins", () => {
    test("twins for publications and the feed", async () => {
        expect(await markdownTwin("/posts", publications)).toBe("/posts.md");
        expect(await markdownTwin("/posts/1779066375000-farfield", publications)).toBe(
            "/posts/1779066375000-farfield.md",
        );
        expect(await markdownTwin("/feed", publications)).toBe("/feed.md");
        expect(await markdownTwin("/feed/abc123", publications)).toBe("/feed/abc123.md");
        expect(await markdownTwin("/tags", publications)).toBeNull();
    });

    test("?mode=agent falls back to the site overview", async () => {
        expect(await agentModeRedirect("/", publications)).toBe("/index.md");
        expect(await agentModeRedirect("/tags/llms", publications)).toBe("/index.md");
        expect(await agentModeRedirect("/recipes", publications)).toBe("/recipes.md");
    });
});
