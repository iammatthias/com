import { describe, expect, test } from "bun:test";
import { forgetMemo, memo } from "./memo";

function loader<T>(values: T[]) {
    let calls = 0;
    const resolvers: Array<(v: T) => void> = [];
    const load = () =>
        new Promise<T>((resolve) => {
            calls++;
            resolvers.push(resolve);
        });
    const settle = (i = 0) => resolvers[i](values[i]);
    return { load, settle, calls: () => calls };
}

describe("memo", () => {
    test("concurrent callers share one in-flight load", async () => {
        forgetMemo();
        const l = loader(["a"]);
        const p1 = memo("k1", l.load);
        const p2 = memo("k1", l.load);
        expect(l.calls()).toBe(1);
        l.settle(0);
        expect(await p1).toBe("a");
        expect(await p2).toBe("a");
    });

    test("serves the cached value inside the ttl and reloads after it", async () => {
        forgetMemo();
        let t = 0;
        const now = () => t;
        const l = loader(["a", "b"]);
        const first = memo("k2", l.load, { now, ttlMs: 1000 });
        l.settle(0);
        expect(await first).toBe("a");

        t = 999;
        expect(await memo("k2", l.load, { now, ttlMs: 1000 })).toBe("a");
        expect(l.calls()).toBe(1);

        t = 1001;
        const third = memo("k2", l.load, { now, ttlMs: 1000 });
        expect(l.calls()).toBe(2);
        l.settle(1);
        expect(await third).toBe("b");
    });

    test("onError receives the stale value once the entry has expired", async () => {
        forgetMemo();
        let t = 0;
        const now = () => t;
        const good = memo("k3", () => Promise.resolve("stale"), { now, ttlMs: 10 });
        expect(await good).toBe("stale");

        t = 50;
        const seen: unknown[] = [];
        const result = await memo("k3", () => Promise.reject(new Error("down")), {
            now,
            ttlMs: 10,
            onError: (err, stale) => {
                seen.push(err, stale);
                return stale ?? "fallback";
            },
        });
        expect(result).toBe("stale");
        expect((seen[0] as Error).message).toBe("down");
        expect(seen[1]).toBe("stale");
    });

    test("without onError a failed load rejects and leaves nothing in flight", async () => {
        forgetMemo();
        await expect(memo("k4", () => Promise.reject(new Error("no")))).rejects.toThrow(
            "no",
        );
        const l = loader(["recovered"]);
        const retry = memo("k4", l.load);
        expect(l.calls()).toBe(1);
        l.settle(0);
        expect(await retry).toBe("recovered");
    });
});
