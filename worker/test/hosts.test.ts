import { describe, expect, test } from "bun:test";
import worker from "../src/index";

const env = { ASSETS: { fetch: async () => new Response("<!doctype html>", { headers: { "content-type": "text/html" } }) } };
const exec = { waitUntil() {}, passThroughOnException() {} };
const get = (url: string) => worker.fetch(new Request(url), env as never, exec as never);

describe("the site's other names", () => {
    test("each goes to the same path and query on the apex, for good", async () => {
        for (const host of ["www.iammatthias.com", "next.iammatthias.com", "iam.contact"]) {
            const res = await get(`https://${host}/posts/x?y=1&z=2`);
            expect(res.status).toBe(301);
            expect(res.headers.get("Location")).toBe("https://iammatthias.com/posts/x?y=1&z=2");
        }
        expect((await get("https://iam.contact/")).headers.get("Location")).toBe("https://iammatthias.com/");
    });

    test("the apex is served and indexable", async () => {
        const res = await get("https://iammatthias.com/b/0123456789abcdef/x.js");
        expect(res.status).not.toBe(301);
        expect(res.headers.get("X-Robots-Tag")).toBeNull();
    });

    test("an unknown host is served, but kept out of search", async () => {
        const res = await get("https://com.example.workers.dev/b/0123456789abcdef/x.js");
        expect(res.status).not.toBe(301);
        expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    });
});
