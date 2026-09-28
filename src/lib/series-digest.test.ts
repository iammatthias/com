import { describe, expect, test } from "bun:test";
import { renderKey, seriesKeyFor } from "./render-key";

const doc = { cid: "bafyDOC", publishedAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" };
const index = new Map([
    ["no-stone-unturned", "bafySERIES1"],
    ["as-above", "bafySERIES2"],
]);

describe("seriesKeyFor", () => {
    test("is empty for a body with no series embed", () => {
        expect(seriesKeyFor("![](blob://bafyIMG)\n\ntext", index)).toBe("");
    });

    test("picks up the embedded series' cid", () => {
        expect(seriesKeyFor("![](series://no-stone-unturned)", index)).toBe(
            "no-stone-unturned:bafySERIES1",
        );
    });

    test("is stable regardless of embed order, and de-duplicates", () => {
        const a = seriesKeyFor("![](series://as-above)\n![](series://no-stone-unturned)", index);
        const b = seriesKeyFor("![](series://no-stone-unturned)\n![](series://as-above)\n![](series://as-above)", index);
        expect(a).toBe(b);
        expect(a).toBe("as-above:bafySERIES2,no-stone-unturned:bafySERIES1");
    });

    test("marks a series that no longer exists rather than silently dropping it", () => {
        expect(seriesKeyFor("![](series://deleted)", index)).toBe("deleted:missing");
    });

    test("ignores blob embeds, which already move the document's own cid", () => {
        expect(seriesKeyFor("![](blob://a)\n![](blob://b)", index)).toBe("");
    });
});

describe("renderKey", () => {
    test("is unchanged for documents that embed no series", () => {
        expect(renderKey(doc)).toBe("bafyDOC@2026-01-01T00:00:00Z@2026-01-02T00:00:00Z");
        expect(renderKey(doc, "")).toBe(renderKey(doc));
    });

    test("moves when an embedded series is rewritten, even though the doc is untouched", () => {
        const before = renderKey(doc, seriesKeyFor("![](series://no-stone-unturned)", index));
        const after = renderKey(
            doc,
            seriesKeyFor("![](series://no-stone-unturned)", new Map([["no-stone-unturned", "bafySERIES1_REWRITTEN"]])),
        );
        expect(before).not.toBe(after);
    });

    test("does not move when an unrelated series changes", () => {
        const body = "![](series://no-stone-unturned)";
        const before = renderKey(doc, seriesKeyFor(body, index));
        const other = new Map(index);
        other.set("as-above", "bafyOTHER_CHANGED");
        expect(renderKey(doc, seriesKeyFor(body, other))).toBe(before);
    });

    test("still moves when the document itself changes", () => {
        const k = seriesKeyFor("![](series://as-above)", index);
        expect(renderKey({ ...doc, cid: "bafyDOC2" }, k)).not.toBe(renderKey(doc, k));
    });
});
