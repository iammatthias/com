import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";
import { renderFeedBody } from "@lib/doc-render";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const tag = context.params.tag;
    if (!tag) return new Response(null, { status: 404 });

    const { entries, error, cacheHint } = await getLiveCollection(
        "documents",
        { tag },
    );
    if (error) {
        console.error(`[/tags/${tag}/rss.xml] Farfield fetch failed:`, error);
    }
    const items = entriesOf<DocumentData>(entries);

    // No docs carrying this tag → return 404 rather than an empty feed
    // (lets readers/aggregators notice and unsubscribe rather than
    // poll a dead URL forever).
    if (items.length === 0) return new Response(null, { status: 404 });

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = await rss({
        title: `iammatthias — #${tag}`,
        description: `Entries tagged ${tag}.`,
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Full body, capped galleries, media:content thumb — see rss.xml.ts.
        items: await Promise.all(
            items.map(async (item: DocumentData) => {
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
        ),
        xmlns: { media: "http://search.yahoo.com/mrss/" },
        customData: "<language>en-us</language>",
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint);
    return response;
};
