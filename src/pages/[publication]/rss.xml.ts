export const prerender = false;

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { docFeedItems } from "@lib/doc-body-cache";
import { siteOrigin } from "@lib/http";
import { sectionForRoute } from "@lib/content-query";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ params, site }) => {
    const section = await sectionForRoute(params.publication);
    if (!section) return new Response(null, { status: 404 });
    const { pub } = section;
    const items = section.items.slice(0, RSS_ITEM_CAP);
    const origin = siteOrigin(site);

    const response = await rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
    setDocumentPageCacheHeaders(response);
    return response;
};
