// Sitewide RSS, prerendered — regenerated on every build; the
// Farfield publish hook keeps it fresh. Newest RSS_ITEM_CAP documents
// with full bodies (embeds resolved to absolute URLs), capped
// galleries, and a media:content thumbnail per item.

export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { docFeedItems, FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { siteOrigin } from "@lib/http";
import { publishedDocs } from "@lib/content-query";
import { SITE_IDENTITY } from "@lib/agent-surface";

export const GET: APIRoute = async ({ site }) => {
    const items = (await publishedDocs()).slice(0, RSS_ITEM_CAP);

    const origin = siteOrigin(site);

    return rss({
        title: "iammatthias",
        description:
            SITE_IDENTITY.tagline,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
};
