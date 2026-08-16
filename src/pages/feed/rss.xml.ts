import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type FeedEntryData } from "@lib/farfield-loader";
import { plainText } from "@lib/markdown-text";
import { renderFeedBody, RSS_ITEM_CAP } from "@lib/doc-render";
import { headFromGet, mapWithConcurrency } from "@lib/http";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const collection = await getLiveCollection("feedEntries");
    if (collection.error) {
        console.error(
            "[/feed/rss.xml] Farfield fetch failed:",
            collection.error,
        );
    }
    // Newest RSS_ITEM_CAP, bounded render concurrency — see rss.xml.ts.
    const items = entriesOf<FeedEntryData>(collection.entries).slice(
        0,
        RSS_ITEM_CAP,
    );

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = await rss({
        title: "iammatthias — feed",
        description: "Short posts from iammatthias.",
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Rendered HTML with embeds resolved to images, capped galleries,
        // and a media:content thumb per item — see rss.xml.ts.
        items: await mapWithConcurrency(
            items,
            8,
            async (item: FeedEntryData) => {
                const canonical = `${origin}/feed/${item.rkey}`;
                const content = await renderFeedBody(item.body, {
                    maxImages: 6,
                    moreUrl: canonical,
                });
                const thumb = content.match(/<img src="([^"]+)"/)?.[1];
                // Titleless items, per microblog/notes convention —
                // feed posts have no real title, and a derived one just
                // duplicates the body everywhere it appears (readers'
                // list views and the styled browser page alike). RSS
                // only requires title OR description; the stylesheet
                // links the date instead when there's no title.
                return {
                    description: plainText(item.body).slice(0, 180),
                    content,
                    link: `/feed/${item.rkey}`,
                    pubDate: new Date(item.createdAt),
                    categories: item.tags,
                    ...(thumb && {
                        customData: `<media:content url="${thumb}" medium="image" />`,
                    }),
                };
            },
        ),
        xmlns: { media: "http://search.yahoo.com/mrss/" },
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, collection.cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
