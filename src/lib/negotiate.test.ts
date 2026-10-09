import { describe, expect, test } from "bun:test";
import {
    NEGOTIATED_VARY_HEADER,
    representationFor,
    restoreNegotiatedVary,
    shelveNegotiatedVary,
} from "./negotiate";

const CHROME_ACCEPT =
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
const CHROME_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

function request(headers: Record<string, string>): Request {
    return new Request("https://iammatthias.com/", { headers });
}

describe("representationFor", () => {
    test("a browser navigation gets html", () => {
        expect(representationFor(request({ accept: CHROME_ACCEPT, "user-agent": CHROME_UA }))).toBe("html");
    });

    test("a known crawler gets markdown even when it asks for html", () => {
        expect(representationFor(request({ accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0)" }))).toBe("markdown");
    });

    test("markdown preferred over html by q-value gets markdown", () => {
        expect(representationFor(request({ accept: "text/markdown;q=0.9, text/html;q=0.5, */*;q=0.1" }))).toBe("markdown");
    });

    test("html preferred over markdown stays html", () => {
        expect(representationFor(request({ accept: "text/html, text/markdown;q=0.5" }))).toBe("html");
    });

    test("no headers at all is html", () => {
        expect(representationFor(request({}))).toBe("html");
    });
});

describe("negotiated Vary", () => {
    test("the cached copy carries no Accept or User-Agent variance", () => {
        const headers = new Headers({ Vary: "Accept, Accept-Encoding, User-Agent" });
        shelveNegotiatedVary(headers);
        expect(headers.get("Vary")).toBe("Accept-Encoding");
        expect(headers.get(NEGOTIATED_VARY_HEADER)).toBe("Accept, User-Agent");
    });

    test("the response leaving the gateway gets its full Vary back", () => {
        const headers = new Headers({ Vary: "Accept, Accept-Encoding, User-Agent" });
        shelveNegotiatedVary(headers);
        restoreNegotiatedVary(headers);
        expect(headers.get("Vary")).toBe("Accept-Encoding, Accept, User-Agent");
        expect(headers.has(NEGOTIATED_VARY_HEADER)).toBe(false);
    });

    test("a Vary of only negotiated headers is removed from the cached copy", () => {
        const headers = new Headers({ Vary: "Accept" });
        shelveNegotiatedVary(headers);
        expect(headers.has("Vary")).toBe(false);
        restoreNegotiatedVary(headers);
        expect(headers.get("Vary")).toBe("Accept");
    });

    test("responses that never varied are left alone", () => {
        const headers = new Headers({ Vary: "Accept-Encoding" });
        shelveNegotiatedVary(headers);
        restoreNegotiatedVary(headers);
        expect(headers.get("Vary")).toBe("Accept-Encoding");
        expect(headers.has(NEGOTIATED_VARY_HEADER)).toBe(false);
    });
});
