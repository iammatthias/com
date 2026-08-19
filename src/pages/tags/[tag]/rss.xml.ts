// Per-tag RSS, prerendered. Only tags with at least one published
// entry get a feed (a tag with none has no page either).

export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import type { DocumentData } from "@lib/farfield-loader";
import { renderFeedBody, RSS_ITEM_CAP } from "@lib/doc-render";
import { mapWithConcurrency } from "@lib/http";

export const getStaticPaths: GetStaticPaths = async () => {
    const docs = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const byTag = new Map<string, DocumentData[]>();
    for (const d of docs) {
        for (const t of d.tags) {
            (byTag.get(t) ?? byTag.set(t, []).get(t)!).push(d);
        }
    }
    return [...byTag.entries()].map(([tag, items]) => {
        const capped = items.slice(0, RSS_ITEM_CAP);
        return {
            params: { tag },
            props: { tag, items: capped },
            // Feed rendering re-fetches blob metas — skip it when the
            // capped window is unchanged.
            cacheKey: capped.map((d) => d.cid).join(","),
        };
    });
};

export const GET: APIRoute = async ({ props, site }) => {
    const tag = props.tag as string;
    const items = props.items as DocumentData[];
    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    return rss({
        title: `iammatthias — #${tag}`,
        description: `Entries tagged ${tag}.`,
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
                categories: [item.publication.name, ...item.tags],
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
