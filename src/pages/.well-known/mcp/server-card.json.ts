// MCP server card — lets an agent preview the tools before opening a
// transport connection.

export const prerender = true;

import type { APIRoute } from "astro";
import { mcpServerCard, SITE_ORIGIN } from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(mcpServerCard(`${SITE_ORIGIN}/mcp`), null, 2),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        },
    );
