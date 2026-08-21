// /llms.md — the well-known root markdown path agents probe when they
// arrive cold. Same body as /index.md.

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
