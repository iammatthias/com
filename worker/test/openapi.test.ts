import { describe, expect, test } from "bun:test";
import { openapiSpec } from "../src/routes/wellknown";

type Spec = {
    servers: { url: string }[];
    paths: Record<string, { get: { operationId: string } }>;
};

const spec = (await openapiSpec().json()) as Spec;

describe("openapi.json", () => {
    test("every server joined with every path names a URL the site serves", () => {
        const urls = spec.servers.flatMap((server) =>
            Object.keys(spec.paths).map((path) => server.url.replace(/\/$/, "") + path),
        );
        expect(urls.sort()).toEqual([
            "https://iammatthias.com/api/content.json",
            "https://iammatthias.com/api/search-corpus.json",
            "https://iammatthias.com/api/search-vectors.json",
            "https://iammatthias.com/api/search.json",
            "https://iammatthias.com/api/v1/content.json",
            "https://iammatthias.com/api/v1/search.json",
        ]);
    });

    test("the v1 aliases are operations of their own", () => {
        expect(spec.paths["/api/v1/search.json"].get.operationId).toBe("searchContentV1");
        expect(spec.paths["/api/v1/content.json"].get.operationId).toBe("listContentV1");
        const ids = Object.values(spec.paths).map((p) => p.get.operationId);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
