
export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type {
    DocumentData,
    FeedEntryData,
    PublicationData,
} from "@lib/farfield-loader";
import { publishedDocs } from "@lib/content-query";
import { siteOrigin } from "@lib/http";

interface SitemapEntry {
    loc: string;
    lastmod?: string;
}

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
    const origin = siteOrigin(site);

    const docs = await publishedDocs();
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const feed = (await getCollection("posts")).map(
        (e) => e.data as FeedEntryData,
    );

    const tags = [...new Set(docs.flatMap((d) => d.tags))];

    const newest = (subset: DocumentData[]): string | undefined =>
        subset.length
            ? subset
                  .map((d) => d.updatedAt)
                  .sort()
                  .at(-1)
            : undefined;
    const siteNewest = newest(docs);
    const tagNewest = (t: string) =>
        newest(docs.filter((d) => d.tags.includes(t)));

    const entries: SitemapEntry[] = [
        { loc: `${origin}/`, lastmod: siteNewest },
        { loc: `${origin}/now`, lastmod: siteNewest },
        { loc: `${origin}/resume` },
        { loc: `${origin}/about` },
        { loc: `${origin}/contact` },
        { loc: `${origin}/privacy` },
        { loc: `${origin}/developers` },
        { loc: `${origin}/content`, lastmod: siteNewest },
        { loc: `${origin}/tags`, lastmod: siteNewest },
        { loc: `${origin}/feed`, lastmod: siteNewest },
        { loc: `${origin}/onchain-analytics` },
        ...pubs.map((p) => ({
            loc: `${origin}/${p.slug}`,
            lastmod: newest(docs.filter((d) => d.collection === p.slug)),
        })),
        ...docs.map((d) => ({
            loc: `${origin}${d.href}`,
            lastmod: d.updatedAt,
        })),
        ...tags.map((t) => ({
            loc: `${origin}/tags/${encodeURIComponent(t)}`,
            lastmod: tagNewest(t),
        })),
        ...feed.map((f) => ({
            loc: `${origin}/feed/${f.rkey}`,
            lastmod: f.updatedAt,
        })),
    ];

    const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        entries
            .map((e) => {
                const lastmod = e.lastmod
                    ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>`
                    : "";
                return `  <url><loc>${xmlEscape(e.loc)}</loc>${lastmod}</url>`;
            })
            .join("\n") +
        `\n</urlset>\n`;

    return new Response(body, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
};
