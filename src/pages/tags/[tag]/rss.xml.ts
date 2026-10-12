export const prerender = false;

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { docFeedItems } from "@lib/doc-body-cache";
import { siteOrigin } from "@lib/http";
import { documentsByTag } from "@lib/content-query";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ params, site }) => {
    const tag = params.tag ?? "";
    const items = (await documentsByTag()).get(tag)?.slice(0, RSS_ITEM_CAP);
    if (!items?.length) return new Response(null, { status: 404 });
    const origin = siteOrigin(site);

    const response = await rss({
        title: `iammatthias — #${tag}`,
        description: `Entries tagged ${tag}.`,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
    setDocumentPageCacheHeaders(response);
    return response;
};
