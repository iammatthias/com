
export const prerender = false;

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { docFeedItems } from "@lib/doc-body-cache";
import { siteOrigin } from "@lib/http";
import { publishedDocs } from "@lib/content-query";
import { SITE_IDENTITY } from "@lib/agent-surface";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ site }) => {
    const items = (await publishedDocs()).slice(0, RSS_ITEM_CAP);

    const origin = siteOrigin(site);

    const response = await rss({
        title: "iammatthias",
        description:
            SITE_IDENTITY.tagline,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
    setDocumentPageCacheHeaders(response);
    return response;
};
