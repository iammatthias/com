// /developers/llms.txt — scoped context for the developer surface,
// which is the section an agent looking for API docs probes by name.

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
