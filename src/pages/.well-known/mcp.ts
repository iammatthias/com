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
import { AGENT_SKILLS, SITE_IDENTITY, SITE_ORIGIN } from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                name: SITE_IDENTITY.name,
                description: SITE_IDENTITY.summary,
                version: "1.0.0",
                serverUrl: `${SITE_ORIGIN}/mcp`,
                url: `${SITE_ORIGIN}/mcp`,
                transport: "streamable-http",
                protocolVersion: "2025-06-18",
                authentication: { type: "none" },
                serverCard: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
                tools: AGENT_SKILLS.map((s) => ({
                    name: s.name,
                    title: s.title,
                    description: s.description,
                })),
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
