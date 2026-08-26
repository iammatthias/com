// /.well-known/mcp — the discovery path agents probe for an MCP
// server. Returns the server card (same document as
// /.well-known/mcp/server-card.json) with the transport URL, so a
// client that finds this path alone still learns where to connect.
//
// On-demand rather than prerendered: a static file here would collide
// with the `.well-known/mcp/` directory that holds server-card.json.
// Rendering it in the worker sidesteps the filesystem entirely — the
// asset layer finds no file, and the request falls through to us.
export const prerender = false;

import type { APIRoute } from "astro";
import { mcpServerCard, SITE_ORIGIN } from "@lib/agent-surface";
import { POST as mcpPost, OPTIONS as mcpOptions } from "../mcp";

// The same JSON-RPC handler as /mcp, mounted here too. Two reasons:
// a client that discovers this path can complete a handshake without
// a second hop, and requests under /.well-known are exempt from the
// bot challenges that can intercept root paths — so discovery and
// transport share a code path that is reachable either way.
export const POST = mcpPost;
export const OPTIONS = mcpOptions;

export const GET: APIRoute = ({ request }) => {
    // Same contract as /mcp: a Streamable HTTP client opening the
    // optional SSE stream must get 405, not JSON, or it aborts the
    // handshake.
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
