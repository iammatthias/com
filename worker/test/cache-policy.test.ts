import { afterEach, expect, test } from "bun:test";
import worker from "../src/index";
import { collection, entry, post, restoreFetch, serveFarfield } from "./farfield-stub";

afterEach(restoreFetch);

const PATHS = [
    "/",
    "/posts/beta",
    "/posts",
    "/feed",
    "/feed/page/2",
    "/feed/n-series",
    "/feed/n-plain",
    "/tags",
    "/tags/oak",
    "/content",
    "/about",
    "/menu",
    "/now",
    "/resume",
    "/developers",
    "/posts/alpha",
    "/nowhere",
] as const;

function cacheWorld() {
    const shell = serveFarfield({
        collections: [collection("posts", "Posts")],
        entries: [
            entry({ collection: "posts", slug: "1700000000000-alpha", cid: "bafycpalpha", tags: ["oak"], publishedAt: "2026-03-01T00:00:00Z" }),
            entry({ collection: "posts", slug: "beta", cid: "bafycpbeta", tags: ["oak"], publishedAt: "2026-02-01T00:00:00Z" }),
        ],
        series: [{ slug: "cpseries", cid: "bafycpseries", body: "![](blob://bafycpblob)", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }],
        posts: [
            post({ slug: "n-series", cid: "bafycpnseries", body: "![](series://cpseries)", createdAt: "2026-04-30T00:00:00Z" }),
            ...Array.from({ length: 12 }, (_, i) =>
                post({ slug: i === 0 ? "n-plain" : `n-${i}`, cid: `bafycpn${i}`, body: `note ${i}`, createdAt: `2026-04-${String(29 - i).padStart(2, "0")}T00:00:00Z` }),
            ),
        ],
    });
    return shell;
}

const SHELL_HTML = "<!doctype html><html><head><title>x</title></head><body></body></html>";
const env = {
    ASSETS: { fetch: async () => new Response(SHELL_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }) },
};
const exec = { waitUntil() {}, passThroughOnException() {} };

const HEADERS = ["Cache-Control", "Cloudflare-CDN-Cache-Control", "Cache-Tag", "Last-Modified"] as const;

async function headersAt(url: string): Promise<string> {
    const res = await worker.fetch(new Request(`https://iammatthias.com${url}`), env as never, exec as never);
    await res.body?.cancel();
    return [String(res.status), ...HEADERS.map((h) => res.headers.get(h) ?? "-")].join(" | ");
}

async function cacheHeaders(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const path of PATHS) {
        const q = encodeURIComponent(path);
        out[`html ${path}`] = await headersAt(path);
        out[`route ${path}`] = await headersAt(`/api/app/route?path=${q}`);
        out[`ssr ${path}`] = await headersAt(`/api/app/ssr?path=${q}`);
    }
    return out;
}

test("every route kind keeps its cache headers on the page, its payload and its SSR twin", async () => {
    cacheWorld();
    expect(await cacheHeaders()).toEqual({
        "html /": "200 | no-cache | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "route /": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents | -",
        "ssr /": "200 | public, max-age=0, s-maxage=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "html /posts/beta": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /posts/beta": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /posts/beta": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /posts": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /posts": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /posts": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /feed": "200 | no-cache | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "route /feed": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents | -",
        "ssr /feed": "200 | public, max-age=0, s-maxage=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "html /feed/page/2": "200 | no-cache | public, max-age=300, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,shell | -",
        "route /feed/page/2": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=300, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries | -",
        "ssr /feed/page/2": "200 | public, max-age=0, s-maxage=300, stale-while-revalidate=600 | public, max-age=300, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,shell | -",
        "html /feed/n-series": "200 | no-cache | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "route /feed/n-series": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents | -",
        "ssr /feed/n-series": "200 | public, max-age=0, s-maxage=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "html /feed/n-plain": "200 | no-cache | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,shell | -",
        "route /feed/n-plain": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries | -",
        "ssr /feed/n-plain": "200 | public, max-age=0, s-maxage=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,shell | -",
        "html /tags": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /tags": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /tags": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /tags/oak": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /tags/oak": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /tags/oak": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /content": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /content": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /content": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /about": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "route /about": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "ssr /about": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=86400 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "html /menu": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "route /menu": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /menu": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents,shell | -",
        "html /now": "200 | no-cache | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "route /now": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents | -",
        "ssr /now": "200 | public, max-age=0, s-maxage=60, stale-while-revalidate=300 | public, max-age=60, stale-while-revalidate=86400, stale-if-error=604800 | feed-entries,documents,shell | -",
        "html /resume": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "route /resume": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "ssr /resume": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=86400 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "html /developers": "200 | no-cache | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "route /developers": "200 | public, max-age=60, stale-while-revalidate=300 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "ssr /developers": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=86400 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | shell | -",
        "html /posts/alpha": "301 | - | no-store | - | -",
        "route /posts/alpha": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "ssr /posts/alpha": "200 | public, max-age=0, s-maxage=3600, stale-while-revalidate=3600 | public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800 | documents | -",
        "html /nowhere": "404 | no-cache | no-store | - | -",
        "route /nowhere": "200 | public, max-age=0, s-maxage=60 | no-store | - | -",
        "ssr /nowhere": "200 | public, max-age=0, s-maxage=60 | no-store | - | -"
    });
});
