import { afterEach, describe, expect, test } from "bun:test";
import { graphql } from "graphql";
import { schema } from "../src/lib/graphql-schema";
import { collection, entry, restoreFetch, serveFarfield } from "./farfield-stub";

afterEach(restoreFetch);

const run = async (source: string) => JSON.parse(JSON.stringify(await graphql({ schema, source })));

describe("GraphQL Document dates", () => {
    const world = () =>
        serveFarfield({
            collections: [collection("posts", "Posts")],
            entries: [
                entry({
                    collection: "posts",
                    slug: "dated",
                    cid: "bafygqldated",
                    title: "Dated walnut",
                    body: "walnut",
                    publishedAt: "2026-03-04T05:06:07Z",
                    createdAt: "2026-01-01T00:00:00Z",
                    updatedAt: "2026-03-05T00:00:00Z",
                }),
                entry({
                    collection: "posts",
                    slug: "undated",
                    cid: "bafygqlundated",
                    title: "Undated walnut",
                    body: "walnut",
                    createdAt: "2025-02-02T02:02:02Z",
                    updatedAt: "2025-02-03T00:00:00Z",
                }),
            ],
        });

    test("document returns publishedAt and updatedAt instead of a null error", async () => {
        world();
        expect(await run(`{ document(path: "posts/dated") { ... on Document { title publishedAt updatedAt } } }`)).toEqual({
            data: { document: { title: "Dated walnut", publishedAt: "2026-03-04T05:06:07Z", updatedAt: "2026-03-05T00:00:00Z" } },
        });
    });

    test("an entry with no publishedAt reports its createdAt", async () => {
        world();
        expect(await run(`{ document(path: "undated") { ... on Document { publishedAt updatedAt } } }`)).toEqual({
            data: { document: { publishedAt: "2025-02-02T02:02:02Z", updatedAt: "2025-02-03T00:00:00Z" } },
        });
    });

    test("documents and search carry the same dates", async () => {
        world();
        const expected = [
            { slug: "dated", publishedAt: "2026-03-04T05:06:07Z" },
            { slug: "undated", publishedAt: "2025-02-02T02:02:02Z" },
        ];
        expect(await run(`{ documents { nodes { slug publishedAt } } }`)).toEqual({ data: { documents: { nodes: expected } } });
        expect(await run(`{ search(query: "walnut") { nodes { slug publishedAt } } }`)).toEqual({ data: { search: { nodes: expected } } });
    });
});

describe("GraphQL search cap", () => {
    test("search returns at most 50 hits in all, the same cap REST and MCP enforce", async () => {
        serveFarfield({
            collections: [collection("posts", "Posts")],
            entries: Array.from({ length: 60 }, (_, i) =>
                entry({
                    collection: "posts",
                    slug: `p${i}`,
                    cid: `bafygqlcap${i}`,
                    body: "hazel",
                    publishedAt: `2026-01-01T00:00:${String(i).padStart(2, "0")}Z`,
                }),
            ),
        });
        expect(await run(`{ search(query: "hazel", first: 100) { totalCount pageInfo { hasNextPage } } }`)).toEqual({
            data: { search: { totalCount: 50, pageInfo: { hasNextPage: false } } },
        });
    });

    test("the schema states the cap on search, and documents keeps its own", () => {
        const fields = schema.getQueryType()!.getFields();
        expect(fields.search.description).toBe("Keyword search across titles, tags, and bodies, ranked by relevance. At most 50 hits in all.");
        expect(fields.search.args.find((a) => a.name === "first")!.description).toBe("Items to return (default 20, max 50).");
        expect(fields.documents.args.find((a) => a.name === "first")!.description).toBe("Items to return (default 20, max 100).");
    });
});
