export const prerender = false;

import type { APIRoute } from "astro";
import { homepageMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async () => {
    const response = markdownResponse(await homepageMarkdown(), 300);
    setDocumentPageCacheHeaders(response);
    return response;
};
