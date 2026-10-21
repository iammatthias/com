import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderRoute } from "../src/lib/ssr";

const load = (name: string) => JSON.parse(readFileSync(join(import.meta.dir, "..", "fixtures", "app-api", name), "utf8"));

describe("what a crawler reads without the app", () => {
    test("a listing's entries are the h2s under its h1", async () => {
        const page = await renderRoute(load("content.json"), "/content");
        const outline = [...page.main.matchAll(/<h([1-6])/g)].map((m) => m[1]).join("");
        expect(outline).toMatch(/^12+$/);
    });
});
