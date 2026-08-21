// OpenAPI 3.1 description of the site's public read-only endpoints.
// Generated from lib/agent-surface.ts so the spec can't drift from
// the operations that actually answer (scripts/agent-check.mjs probes
// every declared path).

export const prerender = true;

import type { APIRoute } from "astro";
import {
    API_OPERATIONS,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";

export const GET: APIRoute = () => {
    const paths: Record<string, unknown> = {};
    for (const op of API_OPERATIONS) {
        paths[op.path] = {
            get: {
                operationId: op.operationId,
                summary: op.summary,
                description: op.description,
                tags: ["content"],
                parameters: op.params ?? [],
                responses: {
                    "200": {
                        description: "Success",
                        content: { [op.contentType]: { schema: { type: "object" } } },
                    },
                    "400": {
                        description: "Invalid request parameters",
                        content: {
                            "application/problem+json": {
                                schema: { $ref: "#/components/schemas/Problem" },
                            },
                        },
                    },
                },
            },
        };
    }

    const spec = {
        openapi: "3.1.0",
        info: {
            title: `${SITE_IDENTITY.name} content API`,
            version: "1.0.0",
            summary: "Read-only access to a personal site's published content.",
            description:
                "Public, unauthenticated, read-only endpoints over the published content of iammatthias.com. There is nothing to buy and no account to create; rate limits are Cloudflare's defaults. Every document is also available as markdown by appending .md to its URL, and the same content is exposed as MCP tools at /mcp.",
            contact: {
                name: SITE_IDENTITY.owner,
                email: SITE_IDENTITY.email,
                url: `${SITE_ORIGIN}/contact`,
            },
            license: { name: "All rights reserved", url: `${SITE_ORIGIN}/privacy` },
        },
        servers: [{ url: SITE_ORIGIN, description: "Production" }],
        paths,
        components: {
            schemas: {
                Problem: {
                    type: "object",
                    description:
                        "RFC 9457 problem document with an added resolution hint.",
                    properties: {
                        type: { type: "string", format: "uri" },
                        title: { type: "string" },
                        status: { type: "integer" },
                        code: { type: "string" },
                        detail: { type: "string" },
                        resolution: {
                            type: "string",
                            description: "How to fix the request and retry.",
                        },
                    },
                    required: ["status", "code", "detail"],
                },
            },
        },
        externalDocs: {
            description: "Developer notes",
            url: `${SITE_ORIGIN}/developers`,
        },
    };

    return new Response(JSON.stringify(spec, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
