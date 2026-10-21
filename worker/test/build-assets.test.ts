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
    test("it and the versioned faces are kept at the edge too", async () => {
        for (const path of ["/b/0123456789abcdef/com-76947940fab458ee_bg.wasm", "/fonts-v1/Inter.ttf"]) {
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
