import { describe, expect, test } from "bun:test";
import { DRAWS_PER_HOUR, drawGate, type GateKV } from "../src/draw-gate";

function fakeKv(): GateKV & { ttl: Map<string, number | undefined> } {
    const store = new Map<string, string>();
    const ttl = new Map<string, number | undefined>();
    return {
        ttl,
        async get(key) {
            return store.get(key) ?? null;
        },
        async put(key, value, opts) {
            store.set(key, value);
            ttl.set(key, opts?.expirationTtl);
        },
    };
}

const NOON = Date.UTC(2026, 9, 15, 12, 0, 0);
const SIG = "a".repeat(24);

describe("drawGate", () => {
    test("the first request for a signature draws; the next within a minute does not", async () => {
        const kv = fakeKv();
        expect(await drawGate(kv, SIG, NOON)).toBe("draw");
        expect(kv.ttl.get(`og:drawing:${SIG}`)).toBe(60);
        expect(await drawGate(kv, SIG, NOON + 1000)).toBe("drawing");
        expect(await drawGate(kv, "b".repeat(24), NOON + 1000)).toBe("draw");
    });

    test("past the hourly cap, a new signature gets no browser until the hour turns", async () => {
        const kv = fakeKv();
        for (let i = 0; i < DRAWS_PER_HOUR; i++) expect(await drawGate(kv, String(i).padStart(24, "0"), NOON + i)).toBe("draw");
        expect(await drawGate(kv, SIG, NOON + 60_000)).toBe("capped");
        expect(kv.ttl.get(`og:draws:${Math.floor(NOON / 3_600_000)}`)).toBe(3600);
        expect(await drawGate(kv, SIG, NOON + 3_600_000)).toBe("draw");
    });
});
