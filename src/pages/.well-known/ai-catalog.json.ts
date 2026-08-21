// Agentic Resource Discovery catalog (agenticresourcediscovery.org):
// one document listing every machine-readable resource this site
// publishes, so an agent can enumerate them without probing paths.

export const prerender = true;

import type { APIRoute } from "astro";
import {
    AGENT_RESOURCES,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                $schema: "https://agenticresourcediscovery.org/schema/v1/ai-catalog.json",
                version: "1.0",
                name: SITE_IDENTITY.name,
                description: SITE_IDENTITY.summary,
                homepage: SITE_ORIGIN,
                provider: {
                    name: SITE_IDENTITY.owner,
                    url: SITE_ORIGIN,
                    email: SITE_IDENTITY.email,
                },
                authentication: { type: "none", description: "All resources are public." },
                resources: AGENT_RESOURCES.map((r) => ({
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    description: r.description,
                    url: r.url,
                    mediaType: r.mediaType,
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
