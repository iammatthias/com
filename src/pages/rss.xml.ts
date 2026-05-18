import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "../lib/cache";
import { entriesOf, type DocumentData } from "../lib/farfield-loader";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const { entries, cacheHint } = await getLiveCollection("documents");
    const items = entriesOf<DocumentData>(entries);

    const response = await rss({
        title: "iammatthias",
        description: "Personal site of Matthias Jordan",
        site: context.site?.toString() ?? "https://iammatthias.com",
        items: items.map((item: DocumentData) => ({
            title: item.title,
            description: item.description,
            link: item.href,
            pubDate: new Date(item.publishedAt),
            categories: [item.publication.name, ...item.tags],
        })),
        customData: "<language>en-us</language>",
        // Reference the XSL stylesheet so the feed renders as a styled
        // page when opened directly in a browser (raw XML otherwise).
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint);
    return response;
};
