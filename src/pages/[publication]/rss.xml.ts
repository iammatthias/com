// Per-publication RSS, prerendered. Regenerates on every build — the
// Farfield publish hook is what keeps it fresh. Newest RSS_ITEM_CAP
// entries with full bodies; see rss.xml.ts at the root for the item
// shape rationale.

export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "@lib/farfield-loader";
import { renderFeedBody, RSS_ITEM_CAP } from "@lib/doc-render";
import { mapWithConcurrency } from "@lib/http";

export const getStaticPaths: GetStaticPaths = async () => {
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const docs = (await getCollection("docs")).map(
        (e) => e.data as DocumentData,
    );
    return pubs.map((pub) => {
        const items = docs
            .filter((d) => d.collection === pub.slug && d.published !== false)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
            .slice(0, RSS_ITEM_CAP);
        return {
            params: { publication: pub.slug },
            props: { pub, items },
            // Feed rendering re-fetches blob metas — skip it when the
            // capped window is unchanged.
            cacheKey: items.map((d) => d.cid).join(","),
        };
    });
};

export const GET: APIRoute = async ({ props, site }) => {
    const pub = props.pub as PublicationData;
    const items = props.items as DocumentData[];
    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    return rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
        site: site?.toString() ?? "https://iammatthias.com",
        // Full body, capped galleries, media:content thumb — see rss.xml.ts.
        items: await mapWithConcurrency(items, 8, async (item) => {
            const canonical = `${origin}${item.href}`;
            const content = await renderFeedBody(item.body, {
                maxImages: 6,
                moreUrl: canonical,
            });
            const thumb = content.match(/<img src="([^"]+)"/)?.[1];
            return {
                title: item.title,
                description: item.description,
                content,
                link: item.href,
                pubDate: new Date(item.publishedAt),
                categories: item.tags,
                ...(thumb && {
                    customData: `<media:content url="${thumb}" medium="image" />`,
                }),
            };
        }),
        xmlns: { media: "http://search.yahoo.com/mrss/" },
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });
};
