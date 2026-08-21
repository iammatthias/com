// Public content listing — every published document as structured
// JSON. Prerendered: the whole list is static per build.

export const prerender = true;

import type { APIRoute } from "astro";
import { listContent } from "@lib/agent-data";
import { jsonError } from "@lib/agent-http";

export const GET: APIRoute = async ({ url }) => {
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

    const items = await listContent({ section, tag, limit });
    return new Response(
        JSON.stringify({ count: items.length, items }, null, 2),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
            },
        },
    );
};
