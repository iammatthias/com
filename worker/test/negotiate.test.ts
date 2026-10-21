import { describe, expect, test } from "bun:test";
import { markdownByAgentOnly, wantsMarkdown } from "../src/lib/negotiate";

const req = (headers: Record<string, string>) => new Request("https://iammatthias.com/", { headers });
const BROWSER = "Mozilla/5.0 (Macintosh) Safari/605.1.15";

describe("markdown negotiation", () => {
    test("an agent User-Agent alone picks markdown, and is told apart from Accept", () => {
        const agent = req({ "user-agent": "GPTBot/1.2", accept: "text/html" });
        expect(wantsMarkdown(agent)).toBe(true);
        expect(markdownByAgentOnly(agent)).toBe(true);
    });

    test("markdown asked for by Accept is the shared, Accept-keyed variant", () => {
        const accept = req({ "user-agent": "GPTBot/1.2", accept: "text/markdown" });
        expect(wantsMarkdown(accept)).toBe(true);
        expect(markdownByAgentOnly(accept)).toBe(false);
    });

    test("a browser gets HTML", () => {
        const browser = req({ "user-agent": BROWSER, accept: "text/html,*/*;q=0.8" });
        expect(wantsMarkdown(browser)).toBe(false);
        expect(markdownByAgentOnly(browser)).toBe(false);
    });
});
