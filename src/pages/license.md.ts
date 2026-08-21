// Markdown twin of the licensing terms.

export const prerender = true;

import type { APIRoute } from "astro";
import { licenseMarkdown } from "@lib/agent-markdown";

export const GET: APIRoute = () =>
    new Response(licenseMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            Vary: "Accept",
        },
    });
