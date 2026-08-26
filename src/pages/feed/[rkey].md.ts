// Markdown twin of a feed entry — `/feed/<rkey>.md`.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveEntry } from "astro:content";
import { LiveEntryNotFoundError } from "astro/content/runtime";
import { setResponseCacheHeaders } from "@lib/cache";
import { siteOrigin, headFromGet } from "@lib/http";
import { cachedRender } from "@lib/render-cache";
import {
    composeFeedEntryMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import type { FeedEntryData } from "@lib/farfield-loader";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async (context) => {
    const rkey = context.params.rkey;
    if (!rkey) return new Response(null, { status: 404 });

    const { entry, error, cacheHint } = await getLiveEntry(
        "feedEntries",
        rkey,
    );
    if (error) {
        if (LiveEntryNotFoundError.is(error)) {
            return new Response(null, { status: 404 });
        }
        console.error(`[/feed/${rkey}.md] Farfield fetch failed:`, error);
        return new Response(null, { status: 502 });
    }
    if (!entry) return new Response(null, { status: 404 });
    const item: FeedEntryData = entry.data;

    const origin = siteOrigin(context.site);

    const bodyMd = await cachedRender("feedmdbody", item.cid, () =>
        resolveEmbedsForMarkdown(item.body),
    );

    const response = markdownResponse(
        composeFeedEntryMarkdown(item, bodyMd, origin),
    );
    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
