// Search corpus for the client-side semantic menu search.
//
// Serves every searchable item (documents + feed posts) as compact
// text the browser embeds locally with ternlight (see
// src/scripts/menu-search.ts). The model truncates input at 128 BERT
// tokens (~95 words), so each item ships roughly that much text —
// title-and-lead-weighted, which is where the signal lives anyway.
//
// Each item carries its Farfield `cid` (content hash): the client
// caches vectors in IndexedDB keyed by cid, so re-embedding only
// happens for content that actually changed.

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { plainText } from "@lib/markdown-text";
import {
    entriesOf,
    type DocumentData,
    type FeedEntryData,
} from "@lib/farfield-loader";

export const prerender = false;

interface CorpusItem {
    href: string;
    title: string;
    /** Kicker shown in results — publication name or "feed". */
    kind: string;
    /** Content hash — client-side vector cache key. */
    cid: string;
    /** What actually gets embedded (~95 words max is useful). */
    text: string;
}

/** Title + description + lead of the body, trimmed near the model's
 *  input window so we don't ship text the embedding can't see. */
function docText(d: DocumentData): string {
    const lead = plainText(d.body).slice(0, 600);
    return [d.title, d.description, lead].filter(Boolean).join(" — ");
}

export const GET: APIRoute = async () => {
    const [docsResult, feedResult] = await Promise.all([
        getLiveCollection("documents"),
        getLiveCollection("feedEntries"),
    ]);
    for (const [label, r] of [
        ["documents", docsResult],
        ["feedEntries", feedResult],
    ] as const) {
        if (r.error) {
            console.error(
                `[/api/search-corpus] Farfield ${label} fetch failed:`,
                r.error,
            );
        }
    }

    const docs = entriesOf<DocumentData>(docsResult.entries);
    const feed = entriesOf<FeedEntryData>(feedResult.entries);

    const items: CorpusItem[] = [
        ...docs.map((d) => ({
            href: d.href,
            title: d.title,
            kind: d.publication.name.toLowerCase(),
            cid: d.cid,
            text: docText(d),
        })),
        ...feed.map((f) => {
            const text = plainText(f.body);
            return {
                href: `/feed/${f.rkey}`,
                title: text.slice(0, 80) || `Feed entry ${f.rkey}`,
                kind: "feed",
                cid: f.cid,
                text: text.slice(0, 600),
            };
        }),
    ];

    const response = new Response(JSON.stringify({ items }), {
        headers: { "Content-Type": "application/json" },
    });
    setResponseCacheHeaders(response, docsResult.cacheHint, {
        extraTags: feedResult.cacheHint?.tags,
    });
    return response;
};

export const HEAD = headFromGet(GET);
