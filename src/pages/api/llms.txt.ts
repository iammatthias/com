// /api/llms.txt — scoped context under the section name agents
// probe when looking for API and reference material. Same content as
// /developers/llms.txt; the site has one developer surface, and
// meeting a probe at its expected address costs nothing.

export const prerender = true;

import type { APIRoute } from "astro";
import { developersMarkdown } from "@lib/agent-markdown";

export const GET: APIRoute = async () =>
    new Response(await developersMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            Vary: "Accept",
        },
    });
