
export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import {
    renderKey,
    type DocumentData,
    type PublicationData,
} from "@lib/farfield-loader";
import { docFeedItems, FEED_ENVELOPE, RSS_ITEM_CAP } from "@lib/doc-render";
import { siteOrigin } from "@lib/http";
import { publishedDocs } from "@lib/content-query";

export const getStaticPaths: GetStaticPaths = async () => {
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const docs = await publishedDocs();
    return pubs.map((pub) => {
        const items = docs
            .filter((d) => d.collection === pub.slug)
            .slice(0, RSS_ITEM_CAP);
        return {
            params: { publication: pub.slug },
            props: { pub, items },
            cacheKey: items.map(renderKey).join(","),
        };
    });
};

export const GET: APIRoute = async ({ props, site }) => {
    const pub = props.pub as PublicationData;
    const items = props.items as DocumentData[];
    const origin = siteOrigin(site);

    return rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
        site: site?.toString() ?? "https://iammatthias.com",
        items: await docFeedItems(items, origin),
        ...FEED_ENVELOPE,
    });
};
