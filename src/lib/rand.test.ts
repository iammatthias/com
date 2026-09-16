import { describe, expect, test } from "bun:test";
import { hashSeed, mulberry32 } from "./rand";

describe("mulberry32", () => {
    test("reproduces its known sequence for a fixed seed", () => {
        const rng = mulberry32(12345);
        expect([rng(), rng(), rng(), rng(), rng()]).toEqual([
            0.9797282677609473, 0.3067522644996643, 0.484205421525985,
            0.817934412509203, 0.5094283693470061,
        ]);
    });

    test("two generators on the same seed stay in lockstep", () => {
        const a = mulberry32(99);
        const b = mulberry32(99);
        for (let i = 0; i < 200; i++) expect(a()).toBe(b());
    });

    test("different seeds diverge immediately", () => {
        const first = new Set(
            Array.from({ length: 500 }, (_, i) => mulberry32(i)()),
        );
        expect(first.size).toBe(500);
    });

    test("every draw lands in [0,1)", () => {
        const rng = mulberry32(7);
        for (let i = 0; i < 10_000; i++) {
            const v = rng();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    test("draws spread across the unit interval", () => {
        const rng = mulberry32(2024);
        const buckets = new Array(10).fill(0);
        for (let i = 0; i < 100_000; i++) buckets[Math.floor(rng() * 10)]++;
        for (const b of buckets) {
            expect(b).toBeGreaterThan(9000);
            expect(b).toBeLessThan(11_000);
        }
    });

    test("seeds are truncated to int32, so these collide by design", () => {
        expect(mulberry32(1)()).toBe(mulberry32(1 + 2 ** 32)());
    });
});

describe("hashSeed", () => {
    test("reproduces known FNV-1a values", () => {
        expect(["", "a", "abc", "iammatthias", "bafy123"].map(hashSeed)).toEqual([
            2166136261, 3826002220, 440920331, 3882240071, 792295547,
        ]);
    });

    test("the empty string is the FNV offset basis", () => {
        expect(hashSeed("")).toBe(0x811c9dc5);
    });

    test("always returns an unsigned 32-bit integer", () => {
        for (const s of ["", "z", "a".repeat(500), "🙂", "bafyreiabc123"]) {
            const h = hashSeed(s);
            expect(Number.isInteger(h)).toBe(true);
            expect(h).toBeGreaterThanOrEqual(0);
            expect(h).toBeLessThanOrEqual(0xffffffff);
        }
    });

    test("a one-character change moves the hash", () => {
        expect(hashSeed("post-1")).not.toBe(hashSeed("post-2"));
        expect(hashSeed("ab")).not.toBe(hashSeed("ba"));
    });

    test("distinct cids rarely collide", () => {
        const hashes = new Set(
            Array.from({ length: 5000 }, (_, i) => hashSeed(`bafyrei-${i}`)),
        );
        expect(hashes.size).toBeGreaterThan(4990);
    });
});
