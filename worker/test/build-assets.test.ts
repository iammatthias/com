import { describe, expect, test } from "bun:test";
import worker from "../src/index";

const IMMUTABLE = "public, max-age=31536000, immutable";
const env = {
    ASSETS: { fetch: async () => new Response("export {}", { headers: { "content-type": "text/javascript", "cache-control": "public, max-age=0, must-revalidate" } }) },
};
const exec = { waitUntil() {}, passThroughOnException() {} };
const get = (path: string) => worker.fetch(new Request(`https://iammatthias.com${path}`), env as never, exec as never);

describe("a release build's code", () => {
    test("under /b/<id>/ is kept for a year", async () => {
        for (const path of ["/b/0123456789abcdef/com-76947940fab458ee_bg.wasm", "/b/0123456789abcdef/snippets/com-2116b26e2323790f/js/dom.js", "/b/0123456789abcdef/diagrams/flowchart.js"]) {
            expect((await get(path)).headers.get("Cache-Control")).toBe(IMMUTABLE);
        }
    });
    test("it, the versioned faces and the social loop are kept at the edge too", async () => {
        for (const path of ["/b/0123456789abcdef/com-76947940fab458ee_bg.wasm", "/fonts-v1/Inter.ttf", "/og-v1/loop.mp4"]) {
            const res = await get(path);
            expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
            expect(res.headers.get("Cloudflare-CDN-Cache-Control")).not.toBe("no-store");
        }
    });
    test("anywhere else is asked about again", async () => {
        for (const path of ["/diagrams/flowchart.js", "/snippets/com-2116b26e2323790f/js/dom.js", "/b/not-an-id/x.js"]) {
            expect((await get(path)).headers.get("Cache-Control")).not.toBe(IMMUTABLE);
        }
    });
});

describe("the social loop, asked for the way a video player asks", () => {
    const clip = {
        ASSETS: { fetch: async () => new Response("0123456789", { headers: { "content-type": "video/mp4", "content-length": "10", "cache-control": "public, max-age=0, must-revalidate" } }) },
    };
    const ask = (init: RequestInit = {}) => worker.fetch(new Request("https://iammatthias.com/og-v1/loop.mp4", init), clip as never, exec as never);
    test("whole, kept for a year, and offering ranges", async () => {
        const res = await ask();
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("0123456789");
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
        expect(res.headers.get("Accept-Ranges")).toBe("bytes");
        expect(res.headers.get("Content-Type")).toBe("video/mp4");
    });
    test("a range gets its slice, which the edge never keeps in place of the whole", async () => {
        const res = await ask({ headers: { Range: "bytes=2-5" } });
        expect(res.status).toBe(206);
        expect(await res.text()).toBe("2345");
        expect(res.headers.get("Content-Range")).toBe("bytes 2-5/10");
        expect(res.headers.get("Content-Length")).toBe("4");
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
        expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
        expect(await (await ask({ headers: { Range: "bytes=7-" } })).text()).toBe("789");
        expect(await (await ask({ headers: { Range: "bytes=-3" } })).text()).toBe("789");
        expect(await (await ask({ headers: { Range: "bytes=0-99" } })).text()).toBe("0123456789");
    });
    test("a range past the end is a 416, several ranges the whole file", async () => {
        const past = await ask({ headers: { Range: "bytes=10-" } });
        expect(past.status).toBe(416);
        expect(past.headers.get("Content-Range")).toBe("bytes */10");
        expect(past.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
        const several = await ask({ headers: { Range: "bytes=0-1,5-6" } });
        expect(several.status).toBe(200);
        expect(await several.text()).toBe("0123456789");
    });
    test("a HEAD has the headers and no body", async () => {
        const res = await ask({ method: "HEAD" });
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("");
        expect(res.headers.get("Cache-Control")).toBe(IMMUTABLE);
        expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    });
});

describe("a build file that isn't there", () => {
    const missing = {
        ASSETS: { fetch: async () => new Response("not found", { status: 404, headers: { "content-type": "text/plain" } }) },
    };
    test("is never kept at the edge in place of the one a deploy will add", async () => {
        for (const path of ["/b/0123456789abcdef/diagrams/flowchart.js", "/fonts-v1/Missing.ttf"]) {
            const res = await worker.fetch(new Request(`https://iammatthias.com${path}`), missing as never, exec as never);
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
        }
    });
});
