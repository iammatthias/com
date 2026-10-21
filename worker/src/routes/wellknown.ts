import type { Ctx, Route } from "./context";
import { notFound } from "./context";
import { AGENT_RESOURCES, AGENT_SKILLS, API_OPERATIONS, SITE_IDENTITY, SITE_ORIGIN, mcpServerCard } from "../lib/agent-surface";
import { markdownResponse } from "../lib/agent-http";
import { assetResponse } from "../lib/http";

/** Ported from com/src/pages/.well-known/* and openapi.json.ts. */

const JSON_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
};

const json = (body: unknown, headers: Record<string, string> = JSON_HEADERS) =>
    new Response(JSON.stringify(body, null, 2), { headers });

function agentCard(): Response {
    return json({
        protocolVersion: "0.3.0",
        name: SITE_IDENTITY.name,
        description: SITE_IDENTITY.summary,
        url: `${SITE_ORIGIN}/mcp`,
        preferredTransport: "streamable-http",
        provider: { organization: SITE_IDENTITY.owner, url: SITE_ORIGIN },
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
    });
}

const TYPE_MAP: Record<string, string> = {
    "mcp-server": "application/mcp-server+json",
    openapi: "application/openapi+json",
    graphql: "application/graphql-response+json",
    schema: "application/graphql+sdl",
    documentation: "text/markdown",
    sitemap: "application/xml",
    feed: "application/rss+xml",
};

function aiCatalog(): Response {
    return json({
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
    });
}

function apiCatalog(): Response {
    return json(
        {
            linkset: [
                {
                    anchor: SITE_ORIGIN,
                    item: [
                        { href: `${SITE_ORIGIN}/openapi.json`, type: "application/json", title: "Content API (OpenAPI 3.1)" },
                        { href: `${SITE_ORIGIN}/graphql`, type: "application/graphql-response+json", title: "GraphQL endpoint" },
                        { href: `${SITE_ORIGIN}/mcp`, type: "application/json", title: "MCP server (Streamable HTTP)" },
                    ],
                    "service-desc": [
                        { href: `${SITE_ORIGIN}/openapi.json`, type: "application/json", title: "OpenAPI 3.1 specification" },
                    ],
                    "service-doc": [
                        { href: `${SITE_ORIGIN}/developers`, type: "text/html", title: "Developer and agent notes" },
                        { href: `${SITE_ORIGIN}/developers.md`, type: "text/markdown", title: "Developer and agent notes (markdown)" },
                    ],
                    "service-meta": [
                        { href: `${SITE_ORIGIN}/.well-known/ai-catalog.json`, type: "application/json", title: "Agentic Resource Discovery catalog" },
                        { href: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`, type: "application/json", title: "MCP server card" },
                    ],
                    status: [{ href: `${SITE_ORIGIN}/`, type: "text/html", title: "Site homepage" }],
                },
            ],
        },
        {
            "Content-Type": 'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
            "Cache-Control": "public, max-age=3600",
        },
    );
}

function oauthProtectedResource(): Response {
    return json({
        resource: SITE_ORIGIN,
        authorization_servers: [],
        scopes_supported: [],
        bearer_methods_supported: [],
        resource_documentation: `${SITE_ORIGIN}/auth.md`,
        resource_policy_uri: `${SITE_ORIGIN}/privacy`,
        resource_name: "iammatthias.com public content",
        authentication_required: false,
    });
}

function serverCard(): Response {
    return json(mcpServerCard(`${SITE_ORIGIN}/mcp`), {
        ...JSON_HEADERS,
        "Access-Control-Allow-Origin": "*",
    });
}

async function digest(text: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return `sha256:${[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function agentSkillsIndex(): Promise<Response> {
    return json({
        $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
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
                digest: await digest(`${s.name}\n${s.title}\n${s.description}`),
                endpoint: `${SITE_ORIGIN}/mcp`,
                protocol: "mcp",
                authentication: "none",
            })),
        ),
    });
}

function agentSkill({ params }: Ctx): Response {
    const s = AGENT_SKILLS.find((x) => x.name === params[0]);
    if (!s) return notFound();
    return markdownResponse(`---
name: ${s.name}
title: ${s.title}
description: ${s.description}
protocol: mcp
endpoint: ${SITE_ORIGIN}/mcp
authentication: none
---

# ${s.title}

${s.description}

## How to call it

This skill is a tool on the site's MCP server. Connect to
\`${SITE_ORIGIN}/mcp\` (Streamable HTTP, no authentication) and call
\`${s.name}\` via \`tools/call\`. The tool's input schema comes back from
\`tools/list\`.

\`\`\`json
{ "mcpServers": { "iammatthias": { "url": "${SITE_ORIGIN}/mcp" } } }
\`\`\`

Everything this skill reads is public. See ${SITE_ORIGIN}/developers.md
for the equivalent HTTP and GraphQL surfaces.
`);
}

export function openapiSpec(): Response {
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
                            "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } },
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
                `Public, unauthenticated, read-only endpoints over the published content of iammatthias.com. There is nothing to buy and no account to create; rate limits are Cloudflare's defaults. Every document is also available as markdown by appending .md to its URL, and the same content is exposed as MCP tools at /mcp.`,
            contact: { name: SITE_IDENTITY.owner, email: SITE_IDENTITY.email, url: `${SITE_ORIGIN}/contact` },
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
                    description: "RFC 9457 problem document with an added resolution hint.",
                    properties: {
                        type: { type: "string", format: "uri" },
                        title: { type: "string" },
                        status: { type: "integer" },
                        code: { type: "string" },
                        detail: { type: "string" },
                        resolution: { type: "string", description: "How to fix the request and retry." },
                    },
                    required: ["status", "code", "detail"],
                },
            },
        },
        externalDocs: { description: "Developer notes", url: `${SITE_ORIGIN}/developers` },
    };
    return json(spec);
}

/** com/public/.well-known/atproto-did, byte for byte: the handle's DID plus a newline, no Content-Type. */
export const ATPROTO_DID = "did:plc:p5xem22ammiafn5kxonaksfa\n";

const GET = ["GET", "HEAD"];

export const wellKnownRoutes: Route[] = [
    { methods: GET, pattern: /^\/\.well-known\/atproto-did$/, handler: () => assetResponse(ATPROTO_DID, null) },
    { methods: GET, pattern: /^\/\.well-known\/agent-card\.json$/, handler: agentCard },
    { methods: GET, pattern: /^\/\.well-known\/ai-catalog\.json$/, handler: aiCatalog },
    { methods: GET, pattern: /^\/\.well-known\/api-catalog$/, handler: apiCatalog },
    { methods: GET, pattern: /^\/\.well-known\/oauth-protected-resource$/, handler: oauthProtectedResource },
    { methods: GET, pattern: /^\/\.well-known\/mcp\/server-card\.json$/, handler: serverCard },
    { methods: GET, pattern: /^\/\.well-known\/agent-skills\/index\.json$/, handler: agentSkillsIndex },
    { methods: GET, pattern: /^\/\.well-known\/agent-skills\/([a-z_]+)\.md$/, handler: agentSkill },
    { methods: GET, pattern: /^\/(?:\.well-known\/)?openapi\.json$/, handler: openapiSpec },
];
