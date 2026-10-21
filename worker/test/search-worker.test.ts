import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { DocumentData, FeedEntryData } from "../src/lib/farfield-loader";
import { buildSearchCorpus, SEARCH_DIMS, SEARCH_MODEL } from "../src/lib/search-corpus";
import { loadWorker, WORKER_FILE, type CorpusItem } from "../scripts/search-harness";

const doc = (over: Partial<DocumentData>): DocumentData => ({
    collection: "recipes",
    rkey: "r",
    cid: "cid-r",
    title: "Untitled",
    description: "",
    published: true,
    href: "/recipes/r",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    publication: { slug: "recipes", name: "Recipes" },
    tags: [],
    body: "",
    ...over,
});

const feed = (over: Partial<FeedEntryData>): FeedEntryData => ({
    rkey: "f",
    cid: "cid-f",
    body: "",
    tags: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...over,
});

const corpus: { items: CorpusItem[] } = {
    items: buildSearchCorpus(
        [
            doc({ rkey: "pizza", cid: "cid-pizza", href: "/recipes/pizza", title: "Pizza Margherita", description: "Margherita pizza with homemade dough and sauce.", body: "Fresh mozzarella, basil and olive oil on a thin crust." }),
            doc({ rkey: "sourdough", cid: "cid-sourdough", href: "/posts/sourdough", title: "Sourdough", description: "A starter named Fred.", body: "I grew up on sourdough near San Francisco.", collection: "posts", publication: { slug: "posts", name: "Posts" } }),
            doc({ rkey: "siesta", cid: "cid-siesta", href: "/recipes/siesta", title: "Siesta", description: "A tequila cocktail with Campari and grapefruit.", body: "Shake with ice and serve with a grapefruit peel." }),
        ],
        [feed({ rkey: "hello", cid: "cid-hello", body: "hello world" })],
    ),
};

const zeroVector = Buffer.alloc(SEARCH_DIMS * 4).toString("base64");
const zeros = (model: string) => ({ model, dims: SEARCH_DIMS, vectors: Object.fromEntries(corpus.items.map((i) => [i.cid, zeroVector])) });

describe("buildSearchCorpus", () => {
    test("embeds the title, the description and the lead; names the kind after the publication", () => {
        const pizza = corpus.items.find((i) => i.href === "/recipes/pizza")!;
        expect(pizza.kind).toBe("recipes");
        expect(pizza.text).toBe("Pizza Margherita — Margherita pizza with homemade dough and sauce. — Fresh mozzarella, basil and olive oil on a thin crust.");
    });

    test("a feed note with words is an item named by them; one without words is left out", () => {
        const items = buildSearchCorpus([], [feed({ rkey: "words", cid: "a", body: "Big Trees" }), feed({ rkey: "picture", cid: "b", body: "![](blob://bafy)" })]);
        expect(items.map((i) => [i.href, i.title, i.text])).toEqual([["/feed/words", "Big Trees", "Big Trees"]]);
    });
});

describe("search-worker.js", () => {
    test("holds the same model key as search-model.ts", () => {
        const source = readFileSync(WORKER_FILE, "utf8");
        expect(source).toContain(`const SEARCH_MODEL = ${JSON.stringify(SEARCH_MODEL)};`);
        expect(source).toContain(`const SEARCH_DIMS = ${SEARCH_DIMS};`);
    });

    test("ranks by meaning and by words, and shows nothing for a query the site cannot answer", async () => {
        const worker = await loadWorker(corpus, null);
        expect((await worker.search("pizza", 6)).map((h) => h.href)[0]).toBe("/recipes/pizza");
        expect((await worker.search("fermented bread starter", 6)).map((h) => h.href)[0]).toBe("/posts/sourdough");
        expect((await worker.search("campari", 6)).map((h) => h.href)[0]).toBe("/recipes/siesta");
        expect(await worker.search("quantum chromodynamics", 6)).toEqual([]);
        expect(worker.errors).toEqual([]);
    });

    // "pizza" is in the title (+0.15) and the word is in the text (+0.3)
    const bonusesOnly = 0.15 + 0.3;

    test("takes baked vectors under its own model key: all zeros leave only the title and words bonuses", async () => {
        const worker = await loadWorker(corpus, zeros(SEARCH_MODEL));
        const [pizza] = await worker.search("pizza", 6);
        expect(pizza.href).toBe("/recipes/pizza");
        expect(pizza.score).toBeCloseTo(bonusesOnly, 6);
    });

    test("ignores baked vectors under another model key and embeds the items itself", async () => {
        const worker = await loadWorker(corpus, zeros("@ternlight/base@0.1 something-older"));
        const [pizza] = await worker.search("pizza", 6);
        expect(pizza.href).toBe("/recipes/pizza");
        expect(pizza.score).toBeGreaterThan(bonusesOnly + 0.1);
    });
});
