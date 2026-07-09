// Search corpus for the client-side semantic menu search.
//
// Serves every searchable item (documents + feed posts) as compact
// text the browser embeds locally with ternlight (see
// src/scripts/menu-search.ts). The model truncates input at 128 BERT
// tokens (~95 words), so each item ships roughly that much text —
// title-and-lead-weighted, which is where the signal lives anyway.
//
// Each item carries its Farfield `cid` (content hash): vectors are
// cached by cid everywhere — the prebuilt /api/search-vectors.json
// file, and the client's IndexedDB for anything newer than the build.

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { buildSearchCorpus } from "@lib/search-corpus";
import {
    entriesOf,
    type DocumentData,
    type FeedEntryData,
} from "@lib/farfield-loader";

export const prerender = false;

export const GET: APIRoute = async () => {
    const [docsResult, feedResult] = await Promise.all([
        getLiveCollection("documents"),
        getLiveCollection("feedEntries"),
    ]);
    for (const [label, r] of [
        ["documents", docsResult],
        ["feedEntries", feedResult],
    ] as const) {
        if (r.error) {
            console.error(
                `[/api/search-corpus] Farfield ${label} fetch failed:`,
                r.error,
            );
        }
    }

    const items = buildSearchCorpus(
        entriesOf<DocumentData>(docsResult.entries),
        entriesOf<FeedEntryData>(feedResult.entries),
    );

    const response = new Response(JSON.stringify({ items }), {
        headers: { "Content-Type": "application/json" },
    });
    setResponseCacheHeaders(response, docsResult.cacheHint, {
        extraTags: feedResult.cacheHint?.tags,
    });
    return response;
};

export const HEAD = headFromGet(GET);
