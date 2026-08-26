// Markdown twin of the feed index — `/feed.md`. The whole feed as a
// dated list of snippet links to each post's markdown twin.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { siteOrigin, headFromGet } from "@lib/http";
import { feedIndexMarkdown } from "@lib/markdown-view";
import { entriesOf, type FeedEntryData } from "@lib/farfield-loader";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async (context) => {
    const { entries, error, cacheHint } =
        await getLiveCollection("feedEntries");
    if (error) {
        console.error("[/feed.md] Farfield fetch failed:", error);
        return new Response(null, { status: 502 });
    }
    const items = entriesOf<FeedEntryData>(entries);

    const origin = siteOrigin(context.site);

    // setResponseCacheHeaders overrides the default Cache-Control with
    // the collection's cacheHint.
    const response = markdownResponse(feedIndexMarkdown(items, origin));
    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
