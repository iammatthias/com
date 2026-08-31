
export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import type { DocumentData } from "@lib/farfield-loader";
import { docFeedItems, FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { siteOrigin } from "@lib/http";
import { documentsByTag } from "@lib/content-query";

export const getStaticPaths: GetStaticPaths = async () => {
    const byTag = await documentsByTag();
    return [...byTag.entries()].map(([tag, items]) => {
        const capped = items.slice(0, RSS_ITEM_CAP);
        return {
            params: { tag },
            props: { tag, items: capped },
            cacheKey: capped.map((d) => d.cid).join(","),
        };
    });
};

export const GET: APIRoute = async ({ props, site }) => {
    const tag = props.tag as string;
    const items = props.items as DocumentData[];
    const origin = siteOrigin(site);

    return rss({
        title: `iammatthias — #${tag}`,
        description: `Entries tagged ${tag}.`,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
};
