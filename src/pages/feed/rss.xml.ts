import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type FeedEntryData } from "@lib/farfield-loader";
import { plainText } from "@lib/markdown-text";
import { renderFeedBody } from "@lib/doc-render";
import { headFromGet } from "@lib/http";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const collection = await getLiveCollection("feedEntries");
    if (collection.error) {
        console.error(
            "[/feed/rss.xml] Farfield fetch failed:",
            collection.error,
        );
    }
    const items = entriesOf<FeedEntryData>(collection.entries);

    // Feed entries have a markdown body but no explicit title. Derive
    // a short plain-text title from the body; fall back to the date so
    // empty-prose entries still get a readable line in the feed.
    const itemTitle = (item: FeedEntryData): string => {
        const plain = plainText(item.body);
        if (plain) return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
        return `Update from ${new Date(item.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}`;
    };

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = await rss({
        title: "iammatthias — feed",
        description: "Short posts from iammatthias.",
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Rendered HTML with embeds resolved to images, capped galleries,
        // and a media:content thumb per item — see rss.xml.ts.
        items: await Promise.all(
            items.map(async (item: FeedEntryData) => {
                const canonical = `${origin}/feed/${item.rkey}`;
                const content = await renderFeedBody(item.body, {
                    maxImages: 6,
                    moreUrl: canonical,
                });
                const thumb = content.match(/<img src="([^"]+)"/)?.[1];
                return {
                    title: itemTitle(item),
                    description: plainText(item.body).slice(0, 180),
                    content,
                    link: `/feed/${item.rkey}`,
                    pubDate: new Date(item.createdAt),
                    categories: item.tags,
                    ...(thumb && {
                        customData: `<media:content url="${thumb}" medium="image" />`,
                    }),
                };
            }),
        ),
        xmlns: { media: "http://search.yahoo.com/mrss/" },
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, collection.cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
