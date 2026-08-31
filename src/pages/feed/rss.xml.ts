import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type FeedEntryData } from "@lib/farfield-loader";
import { plainText } from "@lib/markdown-text";
import { FEED_ENVELOPE, renderFeedBody, RSS_ITEM_CAP } from "@lib/doc-render";
import { siteOrigin, headFromGet, mapWithConcurrency } from "@lib/http";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const collection = await getLiveCollection("feedEntries");
    if (collection.error) {
        console.error(
            "[/feed/rss.xml] Farfield fetch failed:",
            collection.error,
        );
    }
    const items = entriesOf<FeedEntryData>(collection.entries).slice(
        0,
        RSS_ITEM_CAP,
    );

    const origin = siteOrigin(context.site);

    const response = await rss({
        title: "iammatthias — feed",
        description: "Short posts from iammatthias.",
        site: context.site?.toString() ?? "https://iammatthias.com",
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
        ...FEED_ENVELOPE,
    });

    setResponseCacheHeaders(response, collection.cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
