// Markdown twin of the feed index — `/feed.md`. The whole feed as a
// dated list of snippet links to each post's markdown twin.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { feedIndexMarkdown } from "@lib/markdown-view";
import { entriesOf, type FeedEntryData } from "@lib/farfield-loader";

export const GET: APIRoute = async (context) => {
    const { entries, error, cacheHint } =
        await getLiveCollection("feedEntries");
    if (error) {
        console.error("[/feed.md] Farfield fetch failed:", error);
        return new Response(null, { status: 502 });
    }
    const items = entriesOf<FeedEntryData>(entries);

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = new Response(feedIndexMarkdown(items, origin), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
