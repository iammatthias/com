// Markdown twin of the document detail page — `/<pub>/<slug>.md`.
// Serves the source markdown with embeds resolved to public URLs and
// record metadata as front matter. Astro's route priority puts this
// mixed segment (`[slug].md`) ahead of the pure-dynamic `[slug]`, so
// the twin never shadows (or gets shadowed by) the HTML page.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveEntry } from "astro:content";
import { LiveEntryNotFoundError } from "astro/content/runtime";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import { cachedRender } from "@lib/render-cache";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import type { DocumentData } from "@lib/farfield-loader";

export const GET: APIRoute = async (context) => {
    const { publication, slug } = context.params;
    if (!publication || !slug) return new Response(null, { status: 404 });

    const { entry, error, cacheHint } = await getLiveEntry("documents", {
        publication,
        slug,
    });
    if (error) {
        if (LiveEntryNotFoundError.is(error)) {
            return new Response(null, { status: 404 });
        }
        console.error(
            `[/${publication}/${slug}.md] Farfield fetch failed:`,
            error,
        );
        return new Response(null, { status: 502 });
    }
    if (!entry) return new Response(null, { status: 404 });
    const doc: DocumentData = entry.data;

    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    // Body resolution (series expansion) is cached by cid; the front
    // matter carries timestamps the cid doesn't cover, so it's
    // composed fresh around the cached body.
    const bodyMd = await cachedRender("mdbody", doc.cid, () =>
        resolveEmbedsForMarkdown(doc.body),
    );

    const response = new Response(
        composeDocumentMarkdown(doc, bodyMd, origin),
        { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
    setResponseCacheHeaders(response, cacheHint);
    return response;
};

export const HEAD = headFromGet(GET);
