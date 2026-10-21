import type { Ctx, Route } from "./context";
import { listContent, searchContent } from "../lib/agent-data";
import { apiHeaders, jsonError } from "../lib/agent-http";
import { API_OPERATIONS, SITE_ORIGIN } from "../lib/agent-surface";
import { glassPick } from "../lib/glass";
import { buildSearchCorpus, SEARCH_DIMS, SEARCH_MODEL } from "../lib/search-corpus";
import { loadAllFeedEntries } from "../lib/farfield-loader";
import { publishedDocs } from "../lib/content-query";
import { EDGE_CACHE_HEADER, setResponseCacheHeaders } from "../lib/cache";
import { DOCUMENTS_TAG, FEED_TAG, bearerMatches, parseContentEvents, tagsFor } from "../lib/revalidate";
import { readSecret } from "../lib/farfield";
import { purgeTags } from "../lib/edge-purge";
import { getContentCache } from "../lib/runtime-env";
import { assetResponse, etagFor } from "../lib/http";

/** Ported from com/src/pages/api/*. */

async function contentJson({ url }: Ctx): Promise<Response> {
    const section = url.searchParams.get("section") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw && (!Number.isFinite(limit) || limit! < 1)) {
        return jsonError(
            400,
            "invalid_parameter",
            "The 'limit' parameter must be a positive integer.",
            "Retry with limit omitted or set to a positive integer, e.g. ?limit=20.",
        );
    }
    const all = await listContent({ section, tag, limit: 1000 });
    const cursor = url.searchParams.get("cursor");
    const start = cursor ? all.findIndex((i) => i.cid === cursor) + 1 : 0;
    if (cursor && start === 0) {
        return jsonError(
            400,
            "invalid_cursor",
            `Cursor "${cursor}" does not match any item.`,
            "Cursors come from a previous response's nextCursor. Omit it to start from the beginning.",
        );
    }
    const size = Math.min(limit ?? 100, 200);
    const items = all.slice(start, start + size);
    const nextCursor = start + items.length < all.length && items.length ? items[items.length - 1].cid : null;
    return new Response(JSON.stringify({ count: items.length, total: all.length, nextCursor, items }, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            ...apiHeaders(),
        },
    });
}

async function searchJson({ url }: Ctx): Promise<Response> {
    const q = url.searchParams.get("q");
    if (!q || !q.trim()) {
        return jsonError(
            400,
            "missing_query",
            "The 'q' parameter is required and must not be empty.",
            "Retry with a query, e.g. /api/search.json?q=cloudflare+workers.",
        );
    }
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 10;
    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
        return jsonError(
            400,
            "invalid_limit",
            "The 'limit' parameter must be an integer between 1 and 50.",
            "Retry with limit omitted (defaults to 10) or within range.",
        );
    }
    const hits = await searchContent(q, limit);
    return new Response(JSON.stringify({ query: q, count: hits.length, hits }, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            ...apiHeaders(),
        },
    });
}

async function searchCorpusJson(): Promise<Response> {
    let failed = 0;
    const [docs, feed] = await Promise.all([
        publishedDocs().catch((err) => {
            console.error("[/api/search-corpus] Farfield documents fetch failed:", err);
            failed++;
            return [];
        }),
        loadAllFeedEntries().catch((err) => {
            console.error("[/api/search-corpus] Farfield feedEntries fetch failed:", err);
            failed++;
            return [];
        }),
    ]);
    const body = JSON.stringify({ items: buildSearchCorpus(docs, feed) });
    if (failed > 0) {
        // a partial corpus serves this request only: no ETag, nothing cached
        return new Response(body, {
            status: failed === 2 ? 503 : 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store", [EDGE_CACHE_HEADER]: "no-store" },
        });
    }
    const response = new Response(body, {
        headers: { "Content-Type": "application/json", ETag: await etagFor(body) },
    });
    // Unlike com (which bypassed the edge here), cached at the edge and purged
    // with the documents/feed-entries tags; the ETag makes client revalidation a 304.
    setResponseCacheHeaders(
        response,
        { lastModified: docs.length ? new Date(docs[0].publishedAt) : new Date(), tags: [DOCUMENTS_TAG] },
        { edge: true, extraTags: [FEED_TAG] },
    );
    return response;
}

export const SEARCH_VECTORS_KV_KEY = "search-vectors:v1";

/**
 * The old site embedded the corpus with ternlight at build time. That model
 * (~7 MB of wasm) does not belong in the Worker, so the vectors are built
 * offline (scripts/build-search-vectors.ts) and stored in CONTENT_CACHE.
 * Without them this serves the same empty shape the old dev server did.
 */
async function searchVectorsJson(): Promise<Response> {
    const kv = await getContentCache();
    const stored = kv ? await kv.get(SEARCH_VECTORS_KV_KEY, "text").catch(() => null) : null;
    return assetResponse(
        stored ?? JSON.stringify({ model: SEARCH_MODEL, dims: SEARCH_DIMS, vectors: {} }),
        "application/json",
        "public, max-age=3600, stale-while-revalidate=86400",
    );
}

async function glassPickJson(): Promise<Response> {
    const pick = await glassPick();
    if (!pick) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    return new Response(JSON.stringify(pick), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
        },
    });
}

const NO_STORE = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function revalidateReply(status: number, body: unknown, extra: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, ...extra } });
}

async function revalidate({ request, exec }: Ctx): Promise<Response> {
    if (!bearerMatches(request.headers.get("authorization"), readSecret("CONTENT_READ_KEY"))) {
        return revalidateReply(401, { error: "unauthorized" });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return revalidateReply(400, { error: "body must be JSON" });
    }
    const events = parseContentEvents(body);
    if (!events) {
        return revalidateReply(400, {
            error: 'expected {"kind": "entry" | "series" | "collection" | "post" | "deploy", "slug"?: string}, or an array of up to 50',
        });
    }
    const tags = tagsFor(events);
    const result = await purgeTags(tags, exec);
    if (!result.success) {
        return revalidateReply(503, { error: "purge failed", tags, errors: result.errors ?? [] }, { "Retry-After": "15" });
    }
    return revalidateReply(200, { purged: tags });
}

const V1: Record<string, (ctx: Ctx) => Promise<Response>> = {
    "search.json": searchJson,
    "content.json": contentJson,
};

async function v1(ctx: Ctx): Promise<Response> {
    const endpoint = (ctx.params[0] ?? "").replace(/^\/+/, "");
    const handler = V1[endpoint];
    if (!handler) {
        return jsonError(
            404,
            "endpoint_not_found",
            `No v1 endpoint at /api/v1/${endpoint}.`,
            `v1 serves: ${Object.keys(V1).join(", ")}. Static datasets stay unversioned at ${API_OPERATIONS.map((o) => o.path).join(", ")}. Specification: ${SITE_ORIGIN}/openapi.json.`,
        );
    }
    return handler(ctx);
}

function apiMissing({ params }: Ctx): Response {
    return jsonError(
        404,
        "endpoint_not_found",
        `No API endpoint at /api/${params[0] ?? ""}.`,
        `Known endpoints: ${API_OPERATIONS.map((o) => o.path).join(", ")}. Full specification at ${SITE_ORIGIN}/openapi.json.`,
    );
}

const GET = ["GET", "HEAD"];
const ANY = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];

export const apiRoutes: Route[] = [
    { methods: GET, pattern: /^\/api\/content\.json$/, handler: contentJson },
    { methods: GET, pattern: /^\/api\/search\.json$/, handler: searchJson },
    { methods: GET, pattern: /^\/api\/search-corpus\.json$/, handler: searchCorpusJson },
    { methods: GET, pattern: /^\/api\/search-vectors\.json$/, handler: searchVectorsJson },
    { methods: GET, pattern: /^\/api\/glass-pick\.json$/, handler: glassPickJson },
    { methods: ["POST"], pattern: /^\/api\/revalidate$/, handler: revalidate },
    { methods: GET, pattern: /^\/api\/v1\/(.*)$/, handler: v1 },
];

export const apiFallbackRoute: Route = { methods: ANY, pattern: /^\/api\/(.*)$/, handler: apiMissing };
