// Markdown twin of the homepage — the canonical markdown entry point
// for an agent that lands at the root from search without reading
// llms.txt first. Also served at /llms.md (same body, different
// well-known name).

export const prerender = true;

import type { APIRoute } from "astro";
import { homepageMarkdown } from "@lib/agent-markdown";

export const GET: APIRoute = async () =>
    new Response(await homepageMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            Vary: "Accept",
        },
    });
