
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { buildSearchCorpus } from "@lib/search-corpus";
import { builtDocFilter } from "@lib/content-query";
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
        entriesOf<DocumentData>(docsResult.entries).filter(
            await builtDocFilter(),
        ),
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
