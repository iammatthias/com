import { describe, expect, test } from "bun:test";
import { getIntrospectionQuery } from "graphql";
import { queryLimitError } from "../src/routes/graphql";
import { mcpPost } from "../src/routes/mcp";
import type { Ctx } from "../src/routes/context";

const aliases = (n: number) => `{ ${Array.from({ length: n }, (_, i) => `a${i}: sections { slug }`).join(" ")} }`;

describe("GraphQL query limits", () => {
    test("ordinary queries and the standard introspection query pass", () => {
        expect(queryLimitError("{ sections { slug entryCount } }")).toBeNull();
        expect(queryLimitError(aliases(10))).toBeNull();
        expect(queryLimitError(getIntrospectionQuery())).toBeNull();
    });

    test("more than ten top-level fields is refused, aliases included", () => {
        expect(queryLimitError(aliases(11))).toContain("11 top-level fields");
    });

    test("fields reached through fragments count", () => {
        const q = `query { ...A ... on Query { x: sections { slug } } } fragment A on Query { ${aliases(10).slice(1, -1)} }`;
        expect(queryLimitError(q)).toContain("11 top-level fields");
    });

    test("only the chosen operation counts", () => {
        const q = `query Big ${aliases(11)} query Small { sections { slug } }`;
        expect(queryLimitError(q, "Small")).toBeNull();
        expect(queryLimitError(q, "Big")).not.toBeNull();
    });

    test("an overlong document is refused before parsing", () => {
        expect(queryLimitError(`{ sections { slug } } #${"x".repeat(9000)}`)).toContain("longer than");
    });

    test("syntax errors are left for graphql() to report", () => {
        expect(queryLimitError("{ sections {")).toBeNull();
    });
});

function mcpCtx(body: unknown): Ctx {
    const request = new Request("https://iammatthias.com/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    return { request, url: new URL(request.url), env: {} as Ctx["env"], exec: {} as Ctx["exec"], params: [] };
}

describe("MCP batch limit", () => {
    test("a batch of more than 20 messages is refused whole", async () => {
        const batch = Array.from({ length: 21 }, (_, i) => ({ jsonrpc: "2.0", id: i, method: "ping" }));
        const res = await mcpPost(mcpCtx(batch));
        const body = (await res.json()) as { error?: { code: number } };
        expect(body.error?.code).toBe(-32600);
    });

    test("a batch of 20 is answered", async () => {
        const batch = Array.from({ length: 20 }, (_, i) => ({ jsonrpc: "2.0", id: i, method: "ping" }));
        const res = await mcpPost(mcpCtx(batch));
        expect(((await res.json()) as unknown[]).length).toBe(20);
    });
});
