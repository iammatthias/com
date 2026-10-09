import { describe, expect, test } from "bun:test";
import { EDGE_CACHE_HEADER, setResponseCacheHeaders } from "./cache";

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
