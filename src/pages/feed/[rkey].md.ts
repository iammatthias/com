// Markdown twin of a feed entry — `/feed/<rkey>.md`.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveEntry } from "astro:content";
import { LiveEntryNotFoundError } from "astro/content/runtime";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { cachedRender } from "@lib/render-cache";
import {
    composeFeedEntryMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import type { FeedEntryData } from "@lib/farfield-loader";

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

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const bodyMd = await cachedRender("feedmdbody", item.cid, () =>
        resolveEmbedsForMarkdown(item.body),
    );

    const response = new Response(
        composeFeedEntryMarkdown(item, bodyMd, origin),
        { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
