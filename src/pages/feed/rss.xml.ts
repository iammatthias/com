import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "../../lib/cache";
import { entriesOf, type FeedEntryData } from "../../lib/farfield-loader";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const collection = await getLiveCollection("feedEntries");
    const items = entriesOf<FeedEntryData>(collection.entries);

    // Feed entries have a markdown body but no explicit title. Derive
    // a short plain-text title from the body; fall back to the date so
    // empty-prose entries still get a readable line in the feed.
    const itemTitle = (item: FeedEntryData): string => {
        const plain = item.body
            .replace(/!\[[^\]]*\]\((blob|series):\/\/[^)]+\)/g, "")
            .replace(/[*_`>#]+/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/\s+/g, " ")
            .trim();
        if (plain) return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
        return `Update from ${new Date(item.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}`;
    };

    const response = await rss({
        title: "iammatthias — feed",
        description: "Short posts from iammatthias.",
        site: context.site?.toString() ?? "https://iammatthias.com",
        items: items.map((item: FeedEntryData) => ({
            title: itemTitle(item),
            description: item.body,
            link: `/feed/${item.rkey}`,
            pubDate: new Date(item.createdAt),
            categories: item.tags,
        })),
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, collection.cacheHint);
    return response;
};
