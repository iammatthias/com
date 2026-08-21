// A2A agent card. This site is a content source rather than a
// conversational agent, so the card advertises exactly that: the MCP
// endpoint, the skills behind it, and no authentication.

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
                protocolVersion: "0.3.0",
                name: SITE_IDENTITY.name,
                description: SITE_IDENTITY.summary,
                url: `${SITE_ORIGIN}/mcp`,
                preferredTransport: "streamable-http",
                provider: {
                    organization: SITE_IDENTITY.owner,
                    url: SITE_ORIGIN,
                },
                version: "1.0.0",
                documentationUrl: `${SITE_ORIGIN}/developers`,
                capabilities: { streaming: false, pushNotifications: false },
                securitySchemes: {},
                security: [],
                defaultInputModes: ["text/plain"],
                defaultOutputModes: ["text/markdown", "text/plain"],
                skills: AGENT_SKILLS.map((s) => ({
                    id: s.name,
                    name: s.title,
                    description: s.description,
                    tags: ["content", "search", "personal-site"],
                    inputModes: ["text/plain"],
                    outputModes: ["text/markdown"],
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
