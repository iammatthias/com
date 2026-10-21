import { describe, expect, test } from "bun:test";
import { bearerMatches, parseContentEvents, tagsFor } from "../src/lib/revalidate";

describe("parseContentEvents", () => {
    test("one event or a batch", () => {
        expect(parseContentEvents({ kind: "entry", slug: "1791519648658-datamosh" })).toEqual([
            { kind: "entry", slug: "1791519648658-datamosh" },
        ]);
        expect(parseContentEvents([{ kind: "series", slug: "datamosh" }, { kind: "post" }])).toEqual([
            { kind: "series", slug: "datamosh" },
            { kind: "post", slug: undefined },
        ]);
    });

    test("anything else is rejected whole, not partly applied", () => {
        expect(parseContentEvents({ kind: "everything" })).toBeNull();
        expect(parseContentEvents([{ kind: "entry" }, { kind: "nope" }])).toBeNull();
        expect(parseContentEvents({ kind: "entry", slug: 3 })).toBeNull();
        expect(parseContentEvents(null)).toBeNull();
        expect(parseContentEvents([])).toBeNull();
        expect(parseContentEvents(Array.from({ length: 51 }, () => ({ kind: "post" })))).toBeNull();
    });
});

describe("tagsFor", () => {
    test("anything document-shaped purges every document-derived page", () => {
        expect(tagsFor([{ kind: "entry", slug: "a" }])).toEqual(["documents"]);
        expect(tagsFor([{ kind: "series", slug: "datamosh" }])).toEqual(["documents"]);
        expect(tagsFor([{ kind: "collection", slug: "art" }])).toEqual(["documents"]);
    });

    test("feed posts only touch the feed", () => {
        expect(tagsFor([{ kind: "post", slug: "3k2" }])).toEqual(["feed-entries"]);
    });

    test("a burst collapses to one purge call's worth of tags", () => {
        expect(tagsFor([{ kind: "entry" }, { kind: "entry" }, { kind: "post" }, { kind: "series" }])).toEqual([
            "documents",
            "feed-entries",
        ]);
    });
});

describe("bearerMatches", () => {
    test("only the exact secret passes", () => {
        expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
        expect(bearerMatches("Bearer s3cre", "s3cret")).toBe(false);
        expect(bearerMatches("Bearer s3cretx", "s3cret")).toBe(false);
        expect(bearerMatches("s3cret", "s3cret")).toBe(false);
        expect(bearerMatches(null, "s3cret")).toBe(false);
    });

    test("an unset secret never matches, even an empty bearer", () => {
        expect(bearerMatches("Bearer ", undefined)).toBe(false);
        expect(bearerMatches("Bearer ", "")).toBe(false);
    });
});
