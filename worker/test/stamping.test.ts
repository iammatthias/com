import { describe, expect, test } from "bun:test";
import { isStampedSlug, unstampSlug } from "../src/lib/slugs";

describe("rkey stamping", () => {
    test("a 13+ digit millisecond prefix marks a stamped rkey", () => {
        expect(isStampedSlug("1779066375000-farfield")).toBe(true);
        expect(isStampedSlug("1602523860000-yorkshire-pudding")).toBe(true);
        expect(isStampedSlug("177906637500-farfield")).toBe(false);
        expect(isStampedSlug("farfield")).toBe(false);
        expect(isStampedSlug("2024-recap")).toBe(false);
    });

    test("unstamping recovers the human slug the redirect matches on", () => {
        expect(unstampSlug("1779066375000-farfield")).toBe("farfield");
        expect(unstampSlug("1766509866956-brandy-peppercorn-sauce-two-ways")).toBe(
            "brandy-peppercorn-sauce-two-ways",
        );
        expect(unstampSlug("farfield")).toBe("farfield");
    });
});
