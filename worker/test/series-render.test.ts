import { afterEach, describe, expect, test } from "bun:test";
import worker from "../src/index";
import { cachedDocBody, cachedFeedBody } from "../src/lib/doc-body-cache";
import { renderFeedBody } from "../src/lib/doc-render";
import { resolveEmbedsForMarkdown } from "../src/lib/markdown-view";
import { resolveAppRoute } from "../src/lib/app-route";
import { renderRoute } from "../src/lib/ssr";
import { setRuntimeEnv } from "../src/lib/runtime-env";
import { post, restoreFetch, serveFarfield } from "./farfield-stub";

afterEach(() => {
    restoreFetch();
    setRuntimeEnv(undefined);
});

const RIVER = "![one](blob://bafysrone)\n\nsome words\n\n![two](blob://bafysrtwo)\n\n![three](blob://bafysrthree)";

function world() {
    return serveFarfield({
        series: [{ slug: "river", cid: "bafysrriver", title: "River", body: RIVER, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }],
        blobs: [
            { cid: "bafysrone", size: 1, mime: "image/jpeg", width: 400, height: 300 },
            { cid: "bafysrtwo", size: 1, mime: "video/mp4", width: 640, height: 360 },
            { cid: "bafysrlone", size: 1, mime: "image/png", width: 100, height: 50 },
        ],
        posts: [
            post({ slug: "sr1", cid: "bafysrpost", body: "Look ![lone](blob://bafysrlone) and ![](series://river) end", createdAt: "2026-02-02T00:00:00Z" }),
        ],
    });
}

function recordingKv(): { keys: string[]; kv: object } {
    const keys: string[] = [];
    const kv = {
        get: async (key: string) => {
            keys.push(key);
            return null;
        },
        getWithMetadata: async () => ({ value: null, metadata: null }),
        put: async () => {},
    };
    setRuntimeEnv({ CONTENT_CACHE: kv });
    return { keys, kv };
}

const renderKeys = (keys: string[]) => keys.filter((k) => k.startsWith("render:")).map((k) => k.split(":").slice(2).join(":"));

describe("render cache keys carry the embedded series' cids", () => {
    test("a document body and its feed rendering", async () => {
        world();
        const { keys } = recordingKv();
        await cachedDocBody({ cid: "bafysrdoc", body: "![](series://river)" });
        await cachedDocBody({ cid: "bafysrplain", body: "words only" });
        await cachedFeedBody({ cid: "bafysrdoc", body: "![](series://river) and ![](series://gone)" }, "https://iammatthias.com/x");
        expect(renderKeys(keys)).toEqual([
            "docbody:bafysrdoc@river:bafysrriver",
            "docbody:bafysrplain",
            "docfeedbody:bafysrdoc@gone:missing,river:bafysrriver",
        ]);
    });

    test("a feed post's markdown twin", async () => {
        world();
        const { keys, kv } = recordingKv();
        const res = await worker.fetch(
            new Request("https://iammatthias.com/feed/sr1.md"),
            { ASSETS: { fetch: async () => new Response("asset") }, CONTENT_CACHE: kv } as never,
            { waitUntil() {}, passThroughOnException() {} } as never,
        );
        expect(res.status).toBe(200);
        expect(renderKeys(keys)).toEqual(["feedmdbody:bafysrpost@river:bafysrriver"]);
    });
});

describe("a series embed expands to its blobs on every surface", () => {
    test("RSS stops at maxImages, fetching meta only for what it shows", async () => {
        const { asked } = serveFarfield({
            series: [
                {
                    slug: "brook",
                    cid: "bafysrbrook",
                    body: "![b1](blob://bafysrbone)\n\n![b2](blob://bafysrbtwo)\n\n![b3](blob://bafysrbthree)",
                    createdAt: "2025-01-01T00:00:00Z",
                    updatedAt: "2025-01-01T00:00:00Z",
                },
            ],
            blobs: [{ cid: "bafysrbtwo", size: 1, mime: "video/mp4" }],
        });
        const html = await renderFeedBody("![solo](blob://bafysrbsolo)\n\n![](series://brook)", { maxImages: 2, moreUrl: "https://iammatthias.com/more" });
        expect(html).toBe(
            `<p><img src="https://wsrv.nl/?url=https%3A%2F%2Fblobs.farfield.systems%2Fblobs%2Fbafysrbsolo&amp;w=960&amp;q=80&amp;output=webp" alt="solo" /></p>` +
                `<p><img src="https://wsrv.nl/?url=https%3A%2F%2Fblobs.farfield.systems%2Fblobs%2Fbafysrbone&amp;w=960&amp;q=80&amp;output=webp" alt="b1" /></p>` +
                `<p><a href="https://iammatthias.com/more">View the full gallery (2 more) →</a></p>`,
        );
        expect(asked.filter((u) => u.endsWith("/meta")).sort()).toEqual([
            "https://blobs.farfield.systems/blobs/bafysrbone/meta",
            "https://blobs.farfield.systems/blobs/bafysrbsolo/meta",
        ]);
    });

    test("the markdown twin keeps the series' prose and points images at blobs", async () => {
        world();
        expect(await resolveEmbedsForMarkdown("Intro\n\n![](series://river)\n\n![](series://gone)")).toBe(
            "Intro\n\n![one](https://blobs.farfield.systems/blobs/bafysrone)\n\nsome words\n\n![two](https://blobs.farfield.systems/blobs/bafysrtwo)\n\n![three](https://blobs.farfield.systems/blobs/bafysrthree)\n\n",
        );
    });

    test("the SSR post page draws each blob in place", async () => {
        world();
        const route = await resolveAppRoute("/feed/sr1", "", { redirects: false });
        if (route.kind !== "post") throw new Error(`got ${route.kind}`);
        expect(route.post.renderKey).toBe("bafysrpost@river:bafysrriver");
        const page = await renderRoute(route, "/feed/sr1");
        const note = page.main.slice(page.main.indexOf(`<div class="feed-note">`), page.main.indexOf(`<footer`));
        expect(note).toBe(
            `<div class="feed-note"><p>Look ` +
                `<figure><img src="/img/bafysrlone?w=720" width="100" height="50" alt="lone" loading="lazy" decoding="async"></figure>` +
                ` and ` +
                `<figure><img src="/img/bafysrone?w=720" width="400" height="300" alt="one" loading="lazy" decoding="async"></figure>` +
                `<figure><video controls preload="none" playsinline src="https://blobs.farfield.systems/blobs/bafysrtwo" aria-label="two"></video></figure>` +
                `<figure><img src="/img/bafysrthree?w=720" width="960" height="720" alt="three" loading="lazy" decoding="async"></figure>` +
                ` end</p></div>`,
        );
    });
});
