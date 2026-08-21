// MCP server card — lets an agent preview the tools before opening a
// transport connection.

export const prerender = true;

import type { APIRoute } from "astro";
import {
    AGENT_SKILLS,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                name: SITE_IDENTITY.name,
                title: `${SITE_IDENTITY.title} content`,
                description: SITE_IDENTITY.summary,
                version: "1.0.0",
                serverUrl: `${SITE_ORIGIN}/mcp`,
                transport: "streamable-http",
                protocolVersion: "2025-06-18",
                authentication: { type: "none" },
                provider: { name: SITE_IDENTITY.owner, url: SITE_ORIGIN },
                documentationUrl: `${SITE_ORIGIN}/developers`,
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
