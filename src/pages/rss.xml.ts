// Sitewide RSS, prerendered — regenerated on every build; the
// Farfield publish hook keeps it fresh. Newest RSS_ITEM_CAP documents
// with full bodies (embeds resolved to absolute URLs), capped
// galleries, and a media:content thumbnail per item.

export const prerender = true;

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { renderFeedBody, RSS_ITEM_CAP } from "@lib/doc-render";
import { mapWithConcurrency } from "@lib/http";
import { publishedDocs } from "@lib/content-query";

export const GET: APIRoute = async ({ site }) => {
    const items = (await publishedDocs()).slice(0, RSS_ITEM_CAP);

    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    return rss({
        title: "iammatthias",
        description:
            "Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.",
        site: site?.toString() ?? "https://iammatthias.com",
        // Full body with embeds resolved to absolute image URLs — posts
        // read complete (text AND images) inside feed readers instead of
        // forcing a click-through on an excerpt. Gallery-heavy items are
        // capped with a canonical "view the full gallery" link.
        items: await mapWithConcurrency(items, 8, async (item) => {
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
        xmlns: { media: "http://search.yahoo.com/mrss/" },
        customData: "<language>en-us</language>",
        // Reference the XSL stylesheet so the feed renders as a styled
        // page when opened directly in a browser (raw XML otherwise).
        stylesheet: "/rss.xml.xsl",
    });
};
