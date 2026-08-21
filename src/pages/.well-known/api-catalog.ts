// RFC 9727 API catalog — a linkset pointing at the service
// descriptions this site publishes.

export const prerender = true;

import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                linkset: [
                    {
                        anchor: SITE_ORIGIN,
                        // `item` is what an RFC 9727 client walks to
                        // enumerate the actual APIs; without it the
                        // linkset describes a catalogue of nothing.
                        item: [
                            {
                                href: `${SITE_ORIGIN}/openapi.json`,
                                type: "application/json",
                                title: "Content API (OpenAPI 3.1)",
                            },
                            {
                                href: `${SITE_ORIGIN}/graphql`,
                                type: "application/graphql-response+json",
                                title: "GraphQL endpoint",
                            },
                            {
                                href: `${SITE_ORIGIN}/mcp`,
                                type: "application/json",
                                title: "MCP server (Streamable HTTP)",
                            },
                        ],
                        "service-desc": [
                            {
                                href: `${SITE_ORIGIN}/openapi.json`,
                                type: "application/json",
                                title: "OpenAPI 3.1 specification",
                            },
                        ],
                        "service-doc": [
                            {
                                href: `${SITE_ORIGIN}/developers`,
                                type: "text/html",
                                title: "Developer and agent notes",
                            },
                            {
                                href: `${SITE_ORIGIN}/developers.md`,
                                type: "text/markdown",
                                title: "Developer and agent notes (markdown)",
                            },
                        ],
                        "service-meta": [
                            {
                                href: `${SITE_ORIGIN}/.well-known/ai-catalog.json`,
                                type: "application/json",
                                title: "Agentic Resource Discovery catalog",
                            },
                            {
                                href: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
                                type: "application/json",
                                title: "MCP server card",
                            },
                        ],
                        status: [
                            {
                                href: `${SITE_ORIGIN}/`,
                                type: "text/html",
                                title: "Site homepage",
                            },
                        ],
                    },
                ],
            },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type":
                    'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
                "Cache-Control": "public, max-age=3600",
            },
        },
    );
