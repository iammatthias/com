// Agent Skills index — the capabilities this site offers, each
// pointing back at the MCP tool that implements it.

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
                version: "1.0",
                name: SITE_IDENTITY.name,
                description: SITE_IDENTITY.summary,
                skills: AGENT_SKILLS.map((s) => ({
                    name: s.name,
                    title: s.title,
                    description: s.description,
                    endpoint: `${SITE_ORIGIN}/mcp`,
                    protocol: "mcp",
                    authentication: "none",
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
