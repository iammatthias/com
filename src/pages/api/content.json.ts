// Public content listing — every published document as structured
// JSON, filterable and cursor-paginated.
//
// On-demand, not prerendered: a static build answers every query
// string identically, which meant the section/tag/limit/cursor
// parameters this endpoint advertises in openapi.json did nothing.
// It reads the build-time content store, so there are still no
// upstream calls.

export const prerender = false;

import type { APIRoute } from "astro";
import { listContent } from "@lib/agent-data";
import { apiHeaders, jsonError } from "@lib/agent-http";

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

    // Cursor pagination: agents page by opaque cursor rather than
    // offset, so inserts at the head of the list can't shift a page
    // under them mid-walk.
    const all = await listContent({ section, tag, limit: 1000 });
    const cursor = url.searchParams.get("cursor");
    const start = cursor
        ? all.findIndex((i) => i.cid === cursor) + 1
        : 0;
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
    const nextCursor =
        start + items.length < all.length && items.length
            ? items[items.length - 1].cid
            : null;

    return new Response(
        JSON.stringify(
            { count: items.length, total: all.length, nextCursor, items },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
                ...apiHeaders(),
            },
        },
    );
};
