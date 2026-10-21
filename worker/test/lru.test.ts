import { describe, expect, test } from "bun:test";
import { Lru } from "../src/lib/lru";

describe("Lru", () => {
    test("keeps at most `max` entries, dropping the oldest", () => {
        const lru = new Lru<string, number>(2);
        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);
        expect(lru.size).toBe(2);
        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("c")).toBe(3);
    });

    test("a read keeps an entry from eviction", () => {
        const lru = new Lru<string, number>(2);
        lru.set("a", 1);
        lru.set("b", 2);
        lru.get("a");
        lru.set("c", 3);
        expect(lru.get("a")).toBe(1);
        expect(lru.get("b")).toBeUndefined();
    });
});
