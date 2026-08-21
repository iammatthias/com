// /pricing.md — machine-readable "it's free", so an agent comparing
// options doesn't have to infer it from the absence of a pricing page.

export const prerender = true;

import type { APIRoute } from "astro";
import { pricingMarkdown } from "@lib/agent-markdown";

export const GET: APIRoute = () =>
    new Response(pricingMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            Vary: "Accept",
        },
    });
