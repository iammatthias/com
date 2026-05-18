import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "../../../lib/cache";
import { entriesOf, type DocumentData } from "../../../lib/farfield-loader";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const tag = context.params.tag;
    if (!tag) return new Response(null, { status: 404 });

    const { entries, cacheHint } = await getLiveCollection("documents", {
        tag,
    });
    const items = entriesOf<DocumentData>(entries);

    // No docs carrying this tag → return 404 rather than an empty feed
    // (lets readers/aggregators notice and unsubscribe rather than
    // poll a dead URL forever).
    if (items.length === 0) return new Response(null, { status: 404 });

    const response = await rss({
        title: `iammatthias — #${tag}`,
        description: `Entries tagged ${tag}.`,
        site: context.site?.toString() ?? "https://iammatthias.com",
        items: items.map((item: DocumentData) => ({
            title: item.title,
            description: item.description,
            link: item.href,
            pubDate: new Date(item.publishedAt),
            categories: [item.publication.name, ...item.tags],
        })),
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint);
    return response;
};
