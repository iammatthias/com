import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";
import { renderFeedBody } from "@lib/doc-render";

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

    const { entries, error, cacheHint } = await getLiveCollection(
        "documents",
        { publication: slug },
    );
    if (error) {
        console.error(`[/${slug}/rss.xml] Farfield fetch failed:`, error);
    }
    const items = entriesOf<DocumentData>(entries);

    const response = await rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Full body, embeds resolved to images — see rss.xml.ts.
        items: await Promise.all(
            items.map(async (item: DocumentData) => ({
                title: item.title,
                description: item.description,
                content: await renderFeedBody(item.body),
                link: item.href,
                pubDate: new Date(item.publishedAt),
                categories: item.tags,
            })),
        ),
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint, {
        extraTags: pubEntry.cacheHint?.tags,
    });
    return response;
};
