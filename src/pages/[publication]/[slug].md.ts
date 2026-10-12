export const prerender = false;

import type { APIRoute } from "astro";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import { documentForRoute } from "@lib/content-query";
import { SITE_ORIGIN } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ params }) => {
    const found = await documentForRoute(params.publication, params.slug);
    if (!found) return new Response(null, { status: 404 });
    const { doc } = found;
    const related = found.related.map((d) => ({
        title: d.title,
        href: d.href,
        description: d.description,
    }));
    const bodyMd = await resolveEmbedsForMarkdown(doc.body);
    const response = markdownResponse(
        composeDocumentMarkdown(doc, bodyMd, SITE_ORIGIN, related),
    );
    setDocumentPageCacheHeaders(response);
    return response;
};
