export const prerender = false;

import type { APIRoute } from "astro";
import { publicationIndexMarkdown } from "@lib/markdown-view";
import { sectionForRoute } from "@lib/content-query";
import { SITE_ORIGIN } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ params }) => {
    const section = await sectionForRoute(params.publication);
    if (!section) return new Response(null, { status: 404 });
    const response = markdownResponse(
        publicationIndexMarkdown(section.pub, section.items, SITE_ORIGIN),
    );
    setDocumentPageCacheHeaders(response);
    return response;
};
