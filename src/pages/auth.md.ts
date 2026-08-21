// /auth.md — how agents authenticate here (they don't). Structured
// per the WorkOS auth.md spec so the sections agents look for exist,
// with honest "not applicable" answers rather than invented flows.

export const prerender = true;

import type { APIRoute } from "astro";
import { authMarkdown } from "@lib/agent-markdown";

export const GET: APIRoute = () =>
    new Response(authMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            Vary: "Accept",
        },
    });
