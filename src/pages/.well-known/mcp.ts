export const prerender = false;

import type { APIRoute } from "astro";
import { mcpServerCard, SITE_ORIGIN } from "@lib/agent-surface";
import { POST as mcpPost, OPTIONS as mcpOptions } from "../mcp";

export const POST = mcpPost;
export const OPTIONS = mcpOptions;

export const GET: APIRoute = ({ request }) => {
    if ((request.headers.get("accept") ?? "").includes("text/event-stream")) {
        return new Response(null, {
            status: 405,
            headers: {
                Allow: "POST, OPTIONS",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
    return new Response(
        JSON.stringify(
            {
                ...mcpServerCard(`${SITE_ORIGIN}/.well-known/mcp`),
                url: `${SITE_ORIGIN}/.well-known/mcp`,
                alternativeUrls: [`${SITE_ORIGIN}/mcp`],
                serverCard: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
            },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        },
    );
};
