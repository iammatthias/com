import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";
import { renderFeedBody } from "@lib/doc-render";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const { entries, error, cacheHint } = await getLiveCollection("documents");
    if (error) {
        console.error("[/rss.xml] Farfield fetch failed:", error);
    }
    const items = entriesOf<DocumentData>(entries);

    const response = await rss({
        title: "iammatthias",
        description:
            "Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.",
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Full body with embeds resolved to absolute image URLs — posts
        // read complete (text AND images) inside feed readers instead of
        // forcing a click-through on an excerpt.
        items: await Promise.all(
            items.map(async (item: DocumentData) => ({
                title: item.title,
                description: item.description,
                content: await renderFeedBody(item.body),
                link: item.href,
                pubDate: new Date(item.publishedAt),
                categories: [item.publication.name, ...item.tags],
            })),
        ),
        customData: "<language>en-us</language>",
        // Reference the XSL stylesheet so the feed renders as a styled
        // page when opened directly in a browser (raw XML otherwise).
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint);
    return response;
};
