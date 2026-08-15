// Markdown twin of a publication index — `/<pub>.md`. One page, no
// pagination: the whole section as a linked list of markdown twins.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { publicationIndexMarkdown } from "@lib/markdown-view";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";

export const GET: APIRoute = async (context) => {
    const slug = context.params.publication;
    if (!slug) return new Response(null, { status: 404 });

    const { entry: pubEntry, error: pubError } = await getLiveEntry(
        "publications",
        slug,
    );
    if (pubError || !pubEntry) return new Response(null, { status: 404 });

    const { entries, error, cacheHint } = await getLiveCollection(
        "documents",
        { publication: slug },
    );
    if (error) {
        console.error(`[/${slug}.md] Farfield fetch failed:`, error);
        return new Response(null, { status: 502 });
    }
    const docs = entriesOf<DocumentData>(entries);

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const response = new Response(
        publicationIndexMarkdown(pubEntry.data, docs, origin),
        { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
    setResponseCacheHeaders(response, cacheHint, {
        extraTags: pubEntry.cacheHint?.tags,
    });
    return response;
};

export const HEAD = headFromGet(GET);
