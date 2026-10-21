import { afterEach, describe, expect, test } from "bun:test";
import { glassPick } from "../src/lib/glass";

const g = globalThis as { caches?: unknown; fetch: typeof fetch };
const realFetch = g.fetch;
const realCaches = g.caches;

afterEach(() => {
    g.fetch = realFetch;
    g.caches = realCaches;
});

const POST = { id: "p", width: 720, height: 840, image1656x0: "https://cdn.glass.photo/a" };

function staleCache(): void {
    const body = JSON.stringify([POST]);
    g.caches = {
        default: {
            match: async () =>
                new Response(body, { headers: { "x-cached-at": String(Date.now() - 60 * 60_000) } }),
            put: async () => undefined,
        },
    };
}

describe("glassPick", () => {
    test("a failed refetch falls back to the stale window", async () => {
        staleCache();
        g.fetch = (async () => {
            throw new DOMException("timed out", "TimeoutError");
        }) as unknown as typeof fetch;
        expect((await glassPick())?.width).toBe(720);
    });

    test("so does an upstream error", async () => {
        staleCache();
        g.fetch = (async () => new Response("nope", { status: 503 })) as unknown as typeof fetch;
        expect((await glassPick())?.width).toBe(720);
    });
});
