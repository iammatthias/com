import { describe, expect, test } from "bun:test";
import { escapeAttr, escapeHtml } from "./format";

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
