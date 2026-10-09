import { describe, expect, test } from "bun:test";
import { getPage, pageHref, parsePageParam } from "./pagination";

const items = Array.from({ length: 25 }, (_, i) => i);

describe("parsePageParam", () => {
    test("the bare index is page one", () => {
        expect(parsePageParam(undefined)).toBe(1);
        expect(parsePageParam("")).toBe(1);
    });

    test("page/1 is not a page — the bare index is", () => {
        expect(parsePageParam("page/1")).toBeNull();
    });

    test("page/N from two up", () => {
        expect(parsePageParam("page/2")).toBe(2);
        expect(parsePageParam("page/17")).toBe(17);
    });

    test("anything else is not a page", () => {
        for (const rest of ["page/0", "page/02", "page/two", "page/2/x", "pages/2", "2"]) {
            expect(parsePageParam(rest)).toBeNull();
        }
    });
});

describe("getPage", () => {
    test("first page links forward only", () => {
        const p = getPage(items, 1, "/posts", 12)!;
        expect(p.items).toEqual(items.slice(0, 12));
        expect([p.totalPages, p.prevHref, p.nextHref]).toEqual([3, null, "/posts/page/2"]);
    });

    test("page two links back to the bare index", () => {
        expect(getPage(items, 2, "/posts", 12)!.prevHref).toBe("/posts");
    });

    test("the last page exists and holds the remainder", () => {
        const p = getPage(items, 3, "/posts", 12)!;
        expect(p.items).toEqual([24]);
        expect([p.prevHref, p.nextHref]).toEqual(["/posts/page/2", null]);
    });

    test("past the last page is out of range", () => {
        expect(getPage(items, 4, "/posts", 12)).toBeNull();
        expect(getPage(items, 0, "/posts", 12)).toBeNull();
    });

    test("an empty list still has one page", () => {
        const p = getPage([], 1, "/posts", 12)!;
        expect([p.totalPages, p.items.length, p.nextHref]).toEqual([1, 0, null]);
    });

    test("an exact multiple does not invent a trailing empty page", () => {
        expect(getPage(items.slice(0, 24), 2, "/posts", 12)!.nextHref).toBeNull();
        expect(getPage(items.slice(0, 24), 3, "/posts", 12)).toBeNull();
    });
});

describe("pageHref", () => {
    test("page one is the bare path", () => {
        expect(pageHref("/tags/astro", 1)).toBe("/tags/astro");
        expect(pageHref("/tags/astro", 3)).toBe("/tags/astro/page/3");
    });
});
