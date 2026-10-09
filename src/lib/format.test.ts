import { describe, expect, test } from "bun:test";
import { escapeAttr, escapeHtml, latest } from "./format";

describe("escaping Farfield text into markup", () => {
    test("ampersands are escaped first, so entities are not double-escaped", () => {
        expect(escapeHtml(`a & <b> "c"`)).toBe("a &amp; &lt;b&gt; &quot;c&quot;");
        expect(escapeHtml("&lt;")).toBe("&amp;lt;");
    });

    test("attributes escape what can break out of a double-quoted value", () => {
        expect(escapeAttr(`x" onload="y`)).toBe("x&quot; onload=&quot;y");
        expect(escapeAttr("<script>")).toBe("&lt;script>");
    });

    test("single quotes are left alone; every attribute is double-quoted", () => {
        expect(escapeHtml("it's")).toBe("it's");
    });
});

describe("latest", () => {
    test("an edit moves Last-Modified past the publish date", () => {
        expect(latest("2026-10-09T04:20:51Z", "2026-10-09T13:25:33Z").toISOString()).toBe("2026-10-09T13:25:33.000Z");
        expect(latest("2026-10-09T13:25:33Z", "2026-10-09T04:20:51Z").toISOString()).toBe("2026-10-09T13:25:33.000Z");
    });

    test("a missing or broken stamp is ignored", () => {
        expect(latest("2026-01-01T00:00:00Z", undefined, "").toISOString()).toBe("2026-01-01T00:00:00.000Z");
    });

    test("never yields an invalid date", () => {
        expect(Number.isNaN(latest(undefined, "nope").getTime())).toBe(false);
    });
});
