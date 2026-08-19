// Sitemap, prerendered from the build-time collections. Regenerated
// on every build — the Farfield publish hook (content and feed alike)
// is what keeps it in step with published content, and documents
// carry a real <lastmod> from Farfield's updatedAt.
//
// Deep pagination pages (`/…/page/N`) are intentionally excluded:
// they're crawlable via the visible pagination links and shift with
// every publish, so listing them adds churn without indexing value.
// `/menu` is noindex, and `/onchain-analytics/<hash>` portraits are
// unbounded generative output — both excluded.

export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type {
    DocumentData,
    FeedEntryData,
    PublicationData,
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

export const GET: APIRoute = async ({ site }) => {
    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    const docs = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false);
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const feed = (await getCollection("posts")).map(
        (e) => e.data as FeedEntryData,
    );

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

    return new Response(body, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
};
