
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
                parameters: [
                    ...(op.params ?? []),
                    {
                        name: "API-Version",
                        in: "header",
                        required: false,
                        schema: { type: "string", enum: ["1"] },
                        description:
                            "Pin the API version. Omit to use the current version; the response always names the version that served it.",
                    },
                ],
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
        servers: [
            { url: SITE_ORIGIN, description: "Production (current version)" },
            {
                url: `${SITE_ORIGIN}/api/v1`,
                description:
                    "Version-pinned aliases of the query endpoints. Same behaviour as the unversioned paths; pin here if you need a surface guaranteed not to change shape.",
            },
        ],
        "x-api-version": "1",
        "x-deprecation-policy": {
            summary:
                "Breaking changes land at a new version path; the previous version keeps working for at least 180 days.",
            signals: [
                "Responses from a deprecated version carry RFC 9745 Deprecation and RFC 8594 Sunset headers.",
                "Every response carries an API-Version header naming the version that served it.",
                "Removals are announced at " + SITE_ORIGIN + "/developers before they ship.",
            ],
            minimumNoticeDays: 180,
        },
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
