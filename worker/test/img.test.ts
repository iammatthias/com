import { afterEach, describe, expect, test } from "bun:test";
import type { Ctx } from "../src/routes/context";
import { appRoutes } from "../src/routes/app";

const imgRoute = appRoutes.find((r) => r.pattern.test("/img/abc"))!;
const IMMUTABLE = "public, max-age=31536000, immutable";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

// each test its own cid: a found meta is kept across requests
let n = 0;
const freshCid = () => `bafy${String(++n).padStart(20, "0")}`;

type Upstream = (url: string, init?: RequestInit) => Response | Promise<Response>;
const realFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = realFetch;
});

/** blobs.farfield.systems and wsrv.nl, as the handler sees them */
function upstreams(meta: Response | (() => Response), blob: Response | (() => Response), wsrv: Upstream) {
    const pick = (r: Response | (() => Response)) => (typeof r === "function" ? r() : r.clone());
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input instanceof Request ? input.url : input);
        if (url.endsWith("/meta")) return pick(meta);
        if (url.startsWith("https://blobs.farfield.systems/")) return pick(blob);
        if (url.startsWith("https://wsrv.nl/")) return wsrv(url, init);
        throw new Error(`unexpected fetch ${url}`);
    }) as typeof fetch;
}

async function img(cid: string, query = ""): Promise<Response> {
    const url = new URL(`https://iammatthias.com/img/${cid}${query}`);
    const ctx = { request: new Request(url), url, params: [cid], exec: { waitUntil() {} } } as unknown as Ctx;
    return (await imgRoute.handler(ctx))!;
}

const rasterMeta = (cid: string) => Response.json({ cid, size: 4, mime: "image/png" });
const blobOk = () => new Response(PNG, { headers: { "content-type": "image/png", "content-length": "4" } });

describe("/img", () => {
    test("a miss is never cached, by the browser or the edge", async () => {
        const res = await img("NOT-A-CID");
        expect(res.status).toBe(404);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    });

    test("a resize is immutable", async () => {
        const cid = freshCid();
        upstreams(rasterMeta(cid), blobOk, () => new Response(PNG, { headers: { "content-type": "image/webp" } }));
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBeNull();
        expect(res.headers.get("Content-Type")).toBe("image/webp");
    });

    test("the raw blob is immutable", async () => {
        const cid = freshCid();
        upstreams(rasterMeta(cid), blobOk, () => {
            throw new Error("wsrv must not be asked for ?raw");
        });
        const res = await img(cid, "?raw");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
        expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    });

    test("a known non-raster blob is immutable too", async () => {
        const cid = freshCid();
        upstreams(Response.json({ cid, size: 4, mime: "video/mp4" }), blobOk, () => {
            throw new Error("wsrv must not be asked for a video");
        });
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
    });

    test("without the blob's meta, the blob stands in for five minutes and the edge keeps nothing", async () => {
        const cid = freshCid();
        upstreams(new Response(null, { status: 404 }), blobOk, () => {
            throw new Error("wsrv must not be asked without meta");
        });
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    });

    test("when wsrv.nl fails, the blob stands in for five minutes", async () => {
        const cid = freshCid();
        upstreams(rasterMeta(cid), blobOk, () => new Response("nope", { status: 502 }));
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    });

    test("when wsrv.nl times out, the blob stands in for five minutes", async () => {
        const cid = freshCid();
        upstreams(rasterMeta(cid), blobOk, (_, init) => {
            expect(init?.signal).toBeInstanceOf(AbortSignal);
            throw new DOMException("The operation was aborted.", "AbortError");
        });
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    });

    test("when the blob store times out, the answer is a 502 nobody keeps", async () => {
        const cid = freshCid();
        upstreams(
            rasterMeta(cid),
            () => {
                throw new DOMException("The operation was aborted.", "AbortError");
            },
            () => new Response("nope", { status: 502 }),
        );
        const res = await img(cid, "?w=640");
        expect(res.status).toBe(502);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    });
});
