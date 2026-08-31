
export const prerender = true;

import type { APIRoute } from "astro";
import {
    AGENT_SKILLS,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";

async function digest(text: string): Promise<string> {
    const buf = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text),
    );
    return `sha256:${[...new Uint8Array(buf)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
}

export const GET: APIRoute = async () =>
    new Response(
        JSON.stringify(
            {
                $schema:
                    "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
                version: "0.2.0",
                name: SITE_IDENTITY.name,
                description: SITE_IDENTITY.summary,
                skills: await Promise.all(
                    AGENT_SKILLS.map(async (s) => ({
                        name: s.name,
                        title: s.title,
                        description: s.description,
                        type: "skill-md",
                        url: `${SITE_ORIGIN}/.well-known/agent-skills/${s.name}.md`,
                        digest: await digest(
                            `${s.name}\n${s.title}\n${s.description}`,
                        ),
                        endpoint: `${SITE_ORIGIN}/mcp`,
                        protocol: "mcp",
                        authentication: "none",
                    })),
                ),
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
