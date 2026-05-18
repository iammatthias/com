import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { setResponseCacheHeaders } from "../../lib/cache";
import { entriesOf, type DocumentData } from "../../lib/farfield-loader";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const slug = context.params.publication;
    if (!slug) return new Response(null, { status: 404 });

    const { entry: pubEntry, error: pubError } = await getLiveEntry(
        "publications",
        slug,
    );
    if (pubError || !pubEntry) return new Response(null, { status: 404 });
    const pub = pubEntry.data;

    const { entries, cacheHint } = await getLiveCollection("documents", {
        publication: slug,
    });
    const items = entriesOf<DocumentData>(entries);

    const response = await rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
        site: context.site?.toString() ?? "https://iammatthias.com",
        items: items.map((item: DocumentData) => ({
            title: item.title,
            description: item.description,
            link: item.href,
            pubDate: new Date(item.publishedAt),
            categories: item.tags,
        })),
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint, {
        extraTags: pubEntry.cacheHint?.tags,
    });
    return response;
};
