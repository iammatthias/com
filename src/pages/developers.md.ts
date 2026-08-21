// /developers.md — the markdown twin of the developer page.

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
