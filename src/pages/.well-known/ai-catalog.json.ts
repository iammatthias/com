// Agentic Resource Discovery catalog (agenticresourcediscovery.org):
// one document listing every machine-readable resource this site
// publishes, so an agent can enumerate them without probing paths.
//
// Shape follows the AI Catalog spec: `specVersion`, a `host` block,
// and an `entries` array where each entry carries a URN identifier, a
// media type, and exactly one of url/data. Identifiers are
// domain-anchored `urn:air:` URNs — `urn:ai:` is rejected as invalid,
// which scores the same as having no catalog at all. The gate asserts
// both the shape and the prefix.

export const prerender = true;

import type { APIRoute } from "astro";
import {
    AGENT_RESOURCES,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";

/** ARD media types per resource kind — how a client decides what a
 *  URL will hand back before fetching it. */
const TYPE_MAP: Record<string, string> = {
    "mcp-server": "application/mcp-server+json",
    openapi: "application/openapi+json",
    graphql: "application/graphql-response+json",
    schema: "application/graphql+sdl",
    documentation: "text/markdown",
    sitemap: "application/xml",
    feed: "application/rss+xml",
    cli: "application/vnd.npm+json",
};

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                specVersion: "1.0",
                host: {
                    displayName: SITE_IDENTITY.title,
                    identifier: "iammatthias.com",
                    description: SITE_IDENTITY.summary,
                    url: SITE_ORIGIN,
                    contact: SITE_IDENTITY.email,
                },
                authentication: {
                    type: "none",
                    description: "All resources are public.",
                    documentation: `${SITE_ORIGIN}/auth.md`,
                },
                entries: AGENT_RESOURCES.map((r) => ({
                    identifier: `urn:air:iammatthias.com:resource:${r.id}`,
                    displayName: r.name,
                    description: r.description,
                    type: TYPE_MAP[r.type] ?? r.mediaType,
                    url: r.url,
                })),
                collections: [],
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
