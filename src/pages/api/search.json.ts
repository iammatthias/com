// Keyword search over the site's published content. On-demand (needs
// the query string), but reads the build-time content store — no
// upstream calls, so it answers from the worker in single-digit ms.

export const prerender = false;

import type { APIRoute } from "astro";
import { searchContent } from "@lib/agent-data";
import { apiHeaders, jsonError } from "@lib/agent-http";
import { headFromGet } from "@lib/http";

export const GET: APIRoute = async ({ url }) => {
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
    return new Response(
        JSON.stringify({ query: q, count: hits.length, hits }, null, 2),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                ...apiHeaders(),
            },
        },
    );
};

export const HEAD = headFromGet(GET);
