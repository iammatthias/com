import { describe, expect, test } from "bun:test";
import { deepPageCacheOptions, EDGE_CACHE_HEADER, setResponseCacheHeaders } from "./cache";

function directives(value: string | null): Map<string, string> {
    const out = new Map<string, string>();
    for (const part of (value ?? "").split(",")) {
        const [k, v = ""] = part.trim().split("=");
        if (k) out.set(k, v);
    }
    return out;
}

describe("edge cache opt-in", () => {
    test("routes that do not opt in leave the edge header to the middleware", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, undefined);
        expect(response.headers.has(EDGE_CACHE_HEADER)).toBe(false);
    });

    test("the edge directive serves stale, so it must not carry s-maxage", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, undefined, { edge: true });
        const edge = directives(response.headers.get(EDGE_CACHE_HEADER));
        expect(edge.has("public")).toBe(true);
        expect(edge.get("max-age")).toBe("60");
        expect(Number(edge.get("stale-while-revalidate"))).toBeGreaterThan(0);
        expect(Number(edge.get("stale-if-error"))).toBeGreaterThan(0);
        expect(edge.has("s-maxage")).toBe(false);
        expect(edge.has("must-revalidate")).toBe(false);
        expect(edge.has("proxy-revalidate")).toBe(false);
    });

    test("deep feed pages keep their longer freshness window at the edge", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, undefined, { maxAge: 300, edge: true });
        expect(directives(response.headers.get(EDGE_CACHE_HEADER)).get("max-age")).toBe("300");
    });
});

describe("browser and CDN cache headers", () => {
    test("browsers revalidate; shared caches hold a minute with five minutes of stale", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, undefined);
        expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    });

    test("only the first page of a listing is short-lived", () => {
        expect(deepPageCacheOptions(1)).toEqual({});
        expect(deepPageCacheOptions(2)).toEqual({ maxAge: 300, swr: 600 });
    });

    test("per-entry tags stay off the response, surface tags are de-duplicated", () => {
        const response = new Response(null);
        setResponseCacheHeaders(
            response,
            { tags: ["feed", "doc-abc", "cid-bafy", "feed-entry-3k2", "feed"] },
            { extraTags: ["home"] },
        );
        expect(response.headers.get("Cache-Tag")).toBe("feed,home");
    });

    test("no surface tags means no Cache-Tag header at all", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, { tags: ["doc-abc"] });
        expect(response.headers.has("Cache-Tag")).toBe(false);
    });

    test("Last-Modified comes from the hint in HTTP date form", () => {
        const response = new Response(null);
        setResponseCacheHeaders(response, { lastModified: new Date("2026-10-09T13:25:58Z") });
        expect(response.headers.get("Last-Modified")).toBe("Fri, 09 Oct 2026 13:25:58 GMT");
    });
});
