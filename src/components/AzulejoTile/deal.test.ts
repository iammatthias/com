import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dealUniforms } from "./deal";
import {
    CENTERS,
    WRAPPERS,
    CORNERS,
    FIELDS,
    FRAMES,
    SHADER_EDGES,
    SHADER_STRAPS,
    SHADER_GROUNDS,
} from "./recipe";

const SEEDS = Array.from({ length: 100 }, (_, i) =>
    Math.imul(i + 1, 0x9e3779b1) >>> 0,
);

const golden = JSON.parse(
    readFileSync(new URL("./__fixtures__/deal.golden.json", import.meta.url), "utf8"),
);

describe("dealUniforms reproduces the captured tiles", () => {
    test("all 100 seeds match the golden uniform vectors", () => {
        for (const seed of SEEDS) {
            expect(JSON.parse(JSON.stringify(dealUniforms(seed)))).toEqual(
                golden[String(seed)],
            );
        }
    });

    test("the same seed always deals the same tile", () => {
        for (const seed of SEEDS.slice(0, 20)) {
            expect(dealUniforms(seed)).toEqual(dealUniforms(seed));
        }
    });

    test("different seeds deal different tiles", () => {
        const fingerprints = new Set(
            SEEDS.map((s) => JSON.stringify(dealUniforms(s))),
        );
        expect(fingerprints.size).toBeGreaterThan(90);
    });
});

describe("every uniform lands in the range the shader dispatches on", () => {
    const tables: Array<[keyof ReturnType<typeof dealUniforms>, readonly string[]]> = [
        ["uCenter", CENTERS],
        ["uWrapper", WRAPPERS],
        ["uCorners", CORNERS],
        ["uEdges", SHADER_EDGES],
        ["uField", FIELDS],
        ["uStraps", SHADER_STRAPS],
        ["uGround", SHADER_GROUNDS],
        ["uFrame", FRAMES],
    ];

    test("motif indices resolve to a real motif, never -1", () => {
        for (const seed of SEEDS) {
            const u = dealUniforms(seed);
            for (const [key, table] of tables) {
                const v = u[key] as number;
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThan(table.length);
                expect(Number.isInteger(v)).toBe(true);
            }
        }
    });

    test("optional second-layer motifs are either -1 or a real index", () => {
        for (const seed of SEEDS) {
            const u = dealUniforms(seed);
            for (const [key, table] of [
                ["uCenter2", CENTERS],
                ["uWrapper2", WRAPPERS],
                ["uCornersB", CORNERS],
            ] as const) {
                const v = u[key];
                expect(v === -1 || (v >= 0 && v < table.length)).toBe(true);
            }
        }
    });

    test("colour channels and scalars stay inside [0,1]", () => {
        for (const seed of SEEDS) {
            const u = dealUniforms(seed);
            for (const key of ["uBg", "uOl", "uC1", "uC2", "uC3", "uGrout"] as const) {
                expect(u[key]).toHaveLength(3);
                for (const c of u[key]) {
                    expect(c).toBeGreaterThanOrEqual(0);
                    expect(c).toBeLessThanOrEqual(1);
                }
            }
            for (const key of ["uV1", "uV2", "uImp"] as const) {
                expect(u[key]).toBeGreaterThanOrEqual(0);
                expect(u[key]).toBeLessThanOrEqual(1);
            }
        }
    });

    test("the impasto jitter spans its intended band across seeds", () => {
        const imps = SEEDS.map((s) => dealUniforms(s).uImp);
        expect(Math.min(...imps)).toBeLessThan(0.52);
        expect(Math.max(...imps)).toBeGreaterThan(0.79);
    });
});
