import { afterEach, describe, expect, test } from "bun:test";
import worker from "../src/index";
import { cardVideoUrl } from "../src/lib/og-card";
import { setRuntimeEnv } from "../src/lib/runtime-env";
import { headHtml } from "../src/lib/seo";

const SIG = "0123456789abcdef01234567";
const CID = "bafkreiloopcid";
const exec = { waitUntil() {}, passThroughOnException() {} };
const shared = { fetch: async () => new Response("SHAREDLOOP", { headers: { "content-type": "video/mp4", "content-length": "10" } }) };
const put: [string, string, unknown][] = [];
const envWith = (map: Record<string, string>) => ({
    ASSETS: shared,
    CONTENT_CACHE: {
        get: async (key: string) => map[key] ?? null,
        put: async (key: string, value: string, opts: unknown) => void put.push([key, value, opts]),
    },
});
const ask = (env: object, path = `/og-video/v1/${SIG}.mp4`, init: RequestInit = {}) =>
    worker.fetch(new Request(`https://iammatthias.com${path}`, init), env as never, exec as never);

const realFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = realFetch;
    put.length = 0;
});
/** blobs as the Worker meets it: the pin lookup answers `pin` (null: no such pin), any other ask the blob */
function blobsAnswer(status: number, body: string, headers: Record<string, string> = {}, pin: string | null = null): { asked: Request[] } {
    const asked: Request[] = [];
    globalThis.fetch = (async (input: RequestInfo, init?: RequestInit) => {
        const req = new Request(input, init);
        asked.push(req);
        if (req.url.startsWith("https://blobs.farfield.systems/pins/")) {
            return pin ? Response.json({ label: `ogv:v1:${SIG}`, cid: pin }) : new Response("no such pin", { status: 404 });
        }
        return new Response(body, { status, headers });
    }) as typeof fetch;
    return { asked };
}

describe("a page's own social loop", () => {
    test("is the blob its sig maps to, the player's range passed through and answered as blobs answers", async () => {
        const { asked } = blobsAnswer(206, "OWN", { "content-type": "video/mp4", "content-range": "bytes 0-2/3400000", "content-length": "3" });
        const res = await ask(envWith({ [`ogv:v1:${SIG}`]: CID }), undefined, { headers: { Range: "bytes=0-2" } });
        expect(res.status).toBe(206);
        expect(await res.text()).toBe("OWN");
        expect(res.headers.get("Content-Range")).toBe("bytes 0-2/3400000");
        expect(asked[0].url).toBe(`https://blobs.farfield.systems/blobs/${CID}`);
        expect(asked[0].headers.get("Range")).toBe("bytes=0-2");
    });
    test("not named in KV yet, is the blob it is pinned as, and KV keeps the pin an hour", async () => {
        const { asked } = blobsAnswer(200, "OWNLOOP", { "content-type": "video/mp4", "content-length": "7" }, CID);
        const res = await ask(envWith({}));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("OWNLOOP");
        expect(asked.map((r) => r.url)).toEqual([`https://blobs.farfield.systems/pins/ogv:v1:${SIG}`, `https://blobs.farfield.systems/blobs/${CID}`]);
        expect(put).toEqual([[`ogv:v1:${SIG}`, CID, { expirationTtl: 3600 }]]);
    });
    test("not drawn yet, is the shared loop, kept only five minutes and never at the edge", async () => {
        blobsAnswer(200, "unused");
        const res = await ask(envWith({}));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("SHAREDLOOP");
        expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
        const part = await ask(envWith({}), undefined, { headers: { Range: "bytes=0-1" } });
        expect(put).toEqual([]);
        expect(part.status).toBe(206);
        expect(part.headers.get("Content-Range")).toBe("bytes 0-1/10");
    });
    test("is the shared loop while blobs can't answer", async () => {
        blobsAnswer(502, "down");
        const res = await ask(envWith({ [`ogv:v1:${SIG}`]: CID }));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("SHAREDLOOP");
    });
    test("is named in the page's head, and the home keeps the shared loop", async () => {
        setRuntimeEnv({ OG_SIGNING_KEY: "test-key" });
        const page = await cardVideoUrl({ path: "/posts/hello", title: "Hello" }, "https://iammatthias.com");
        expect(page).toMatch(/^https:\/\/iammatthias\.com\/og-video\/v1\/[0-9a-f]{24}\.mp4$/);
        expect(await cardVideoUrl({ path: "/" }, "https://iammatthias.com")).toBeUndefined();
        expect(headHtml({ path: "/posts/hello", title: "Hello" }, undefined, page)).toContain(`<meta property="og:video" content="${page}">`);
        setRuntimeEnv({});
    });
});
