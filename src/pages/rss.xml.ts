import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";
import { renderFeedBody } from "@lib/doc-render";
import { headFromGet } from "@lib/http";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const { entries, error, cacheHint } = await getLiveCollection("documents");
    if (error) {
        console.error("[/rss.xml] Farfield fetch failed:", error);
    }
    const items = entriesOf<DocumentData>(entries);

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = await rss({
        title: "iammatthias",
        description:
            "Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.",
        site: context.site?.toString() ?? "https://iammatthias.com",
        // Full body with embeds resolved to absolute image URLs — posts
        // read complete (text AND images) inside feed readers instead of
        // forcing a click-through on an excerpt. Gallery-heavy items are
        // capped with a canonical "view the full gallery" link, and each
        // item carries a media:content thumbnail for reader list views
        // (and the styled browser preview, which can't unescape
        // content:encoded).
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
        // Reference the XSL stylesheet so the feed renders as a styled
        // page when opened directly in a browser (raw XML otherwise).
        stylesheet: "/rss.xml.xsl",
    });

    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
