// Dynamic sitemap built from the live Farfield collections.
//
// @astrojs/sitemap could only see routes known at build time, which on
// this SSR-first site meant the seven prerendered pages — none of the
// documents, publications, tags, or feed entries. This endpoint pulls
// the same live collections the pages render from, so the sitemap is
// always in step with published content, and documents carry a real
// <lastmod> from Farfield's updatedAt.
//
// Deep pagination pages (`/…/page/N`) are intentionally excluded:
// they're crawlable via the visible pagination links and shift with
// every publish, so listing them adds churn without indexing value.
// `/menu` is noindex, and `/onchain-analytics/<hash>` portraits are
// unbounded generative output — both excluded.

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import {
    entriesOf,
    type DocumentData,
    type FeedEntryData,
    type PublicationData,
} from "@lib/farfield-loader";

interface SitemapEntry {
    /** Absolute URL. */
    loc: string;
    /** ISO timestamp; emitted as <lastmod> when present. */
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

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const [docsResult, pubsResult, feedResult] = await Promise.all([
        getLiveCollection("documents"),
        getLiveCollection("publications"),
        getLiveCollection("feedEntries"),
    ]);
    for (const [label, r] of [
        ["documents", docsResult],
        ["publications", pubsResult],
        ["feedEntries", feedResult],
    ] as const) {
        if (r.error) {
            console.error(`[/sitemap.xml] Farfield ${label} fetch failed:`, r.error);
        }
    }

    const docs = entriesOf<DocumentData>(docsResult.entries);
    const pubs = entriesOf<PublicationData>(pubsResult.entries);
    const feed = entriesOf<FeedEntryData>(feedResult.entries);

    const tags = [...new Set(docs.flatMap((d) => d.tags))];

    const entries: SitemapEntry[] = [
        // Evergreen pages. /menu is noindex; deep pagination excluded.
        { loc: `${origin}/` },
        { loc: `${origin}/now` },
        { loc: `${origin}/resume` },
        { loc: `${origin}/content` },
        { loc: `${origin}/tags` },
        { loc: `${origin}/feed` },
        { loc: `${origin}/onchain-analytics` },
        ...pubs.map((p) => ({ loc: `${origin}/${p.slug}` })),
        ...docs.map((d) => ({
            loc: `${origin}${d.href}`,
            lastmod: d.updatedAt,
        })),
        ...tags.map((t) => ({
            loc: `${origin}/tags/${encodeURIComponent(t)}`,
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

    const response = new Response(body, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
    setResponseCacheHeaders(response, docsResult.cacheHint, {
        extraTags: [
            ...(pubsResult.cacheHint?.tags ?? []),
            ...(feedResult.cacheHint?.tags ?? []),
        ],
    });
    return response;
};

export const HEAD = headFromGet(GET);
