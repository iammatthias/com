import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { LiveEntryNotFoundError } from "astro/content/runtime";
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
    // A missing publication is a real 404 (bad slug, deleted pub) — but a
    // transient upstream failure must NOT be: feed readers unsubscribe on
    // persistent 404s. Surface those as 503 + Retry-After so readers keep
    // the subscription and try again.
    if (pubError && !LiveEntryNotFoundError.is(pubError)) {
        console.error(`[/${slug}/rss.xml] publication fetch failed:`, pubError);
        return new Response(null, {
            status: 503,
            headers: { "Retry-After": "120" },
        });
    }
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

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = await rss({
        title: `${pub.name} — iammatthias`,
        description: pub.description ?? `Latest entries from ${pub.name}.`,
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
                    categories: item.tags,
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

    setResponseCacheHeaders(response, cacheHint, {
        extraTags: pubEntry.cacheHint?.tags,
    });
    return response;
};
