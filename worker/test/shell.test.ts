import { describe, expect, test } from "bun:test";
import { shellResponse } from "../src/lib/shell";
import type { SsrPage } from "../src/lib/ssr";
import { etagFor, etagMatches } from "../src/lib/http";
import { appJson } from "../src/routes/app";

const TEMPLATE = "<!doctype html><html><head><title>x</title></head><body></body></html>";

function page(path: string): SsrPage {
    return {
        head: { title: "A page", description: "About it.", path },
        main: `<article><h1>A page</h1></article>`,
        status: 200,
        cache: { kind: "static" },
    };
}

async function shellHtml(path: string): Promise<string> {
    const res = await shellResponse(new Response(TEMPLATE), page(path), "GET", path);
    return res.text();
}

describe("ETags", () => {
    test("the shell carries one over its exact HTML", async () => {
        const res = await shellResponse(new Response(TEMPLATE), page("/about"), "GET", "/about");
        const etag = res.headers.get("ETag");
        expect(etag).toBe(await etagFor(await res.text()));
    });

    test("an app payload carries one that a revalidation matches", async () => {
        const res = await appJson({ kind: "home" });
        const etag = res.headers.get("ETag");
        expect(etag).toBe(await etagFor(JSON.stringify({ kind: "home" })));
        expect(etagMatches(`W/${etag}`, etag)).toBe(true);
    });
});

describe("shellResponse preloads", () => {
    test("the home page preloads the index and the first timeline page", async () => {
        const html = await shellHtml("/");
        expect(html).toContain(`href="/api/app/index"`);
        expect(html).toContain(`href="/api/app/timeline?page=1"`);
    });

    test("any other page preloads the index and its own route, not the timeline", async () => {
        const html = await shellHtml("/about");
        expect(html).toContain(`href="/api/app/index"`);
        expect(html).toContain(`href="/api/app/route?path=/about"`);
        expect(html).not.toContain("/api/app/timeline");
    });
});
