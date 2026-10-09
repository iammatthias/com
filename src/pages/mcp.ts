
export const prerender = false;

import type { APIRoute } from "astro";
import {
    listContent,
    listSections,
    searchContent,
    getDocument,
    MAX_SEARCH_LIMIT,
} from "@lib/agent-data";
import { boundedInt, isJsonObject, isJsonRpcNotification } from "@lib/tool-args";
import { resolveEmbedsForMarkdown } from "@lib/markdown-view";
import { composeDocumentMarkdown } from "@lib/markdown-view";
import {
    AGENT_SKILLS,
    EXAMPLE_DOC_PATH,
    MCP_PROTOCOL_VERSION,
    SECTION_SLUGS,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "@lib/agent-surface";
import {
    homepageMarkdown,
    developersMarkdown,
    authMarkdown,
    pricingMarkdown,
} from "@lib/agent-markdown";

const RESOURCES = [
    {
        uri: `${SITE_ORIGIN}/index.md`,
        name: "Site overview",
        title: "Site overview",
        description:
            "What this site is, its sections, recent entries, and every machine-readable surface it offers.",
        mimeType: "text/markdown",
        load: homepageMarkdown,
    },
    {
        uri: `${SITE_ORIGIN}/developers.md`,
        name: "Developer documentation",
        title: "Developer documentation",
        description:
            "HTTP endpoints, GraphQL, the MCP tools, markdown twins, error shapes, and caching guidance.",
        mimeType: "text/markdown",
        load: developersMarkdown,
    },
    {
        uri: `${SITE_ORIGIN}/auth.md`,
        name: "Authentication",
        title: "Authentication",
        description:
            "How to authenticate (you don't — everything here is public and anonymous).",
        mimeType: "text/markdown",
        load: async () => authMarkdown(),
    },
    {
        uri: `${SITE_ORIGIN}/pricing.md`,
        name: "Pricing",
        title: "Pricing",
        description: "Cost and terms of use for this content (free).",
        mimeType: "text/markdown",
        load: async () => pricingMarkdown(),
    },
];

const skillDescription = (name: string): string => {
    const skill = AGENT_SKILLS.find((s) => s.name === name);
    if (!skill) throw new Error(`AGENT_SKILLS has no entry named ${name}`);
    return skill.description;
};

const SEARCH_LIMIT = { min: 1, max: MAX_SEARCH_LIMIT, fallback: 10 };
const RECENT_LIMIT = { min: 1, max: 200, fallback: 20 };

const TOOLS = [
    {
        name: "search_site",
        title: "Search the site",
        description: skillDescription("search_site"),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    minLength: 1,
                    description: "Search terms, e.g. 'cloudflare workers' or 'pizza dough'.",
                },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: SEARCH_LIMIT.max,
                    default: SEARCH_LIMIT.fallback,
                    description: "Maximum hits to return.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        name: "get_document",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        title: "Read one document",
        description: skillDescription("get_document"),
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    minLength: 1,
                    description: `Document path or slug, e.g. '${EXAMPLE_DOC_PATH}' or a full URL.`,
                },
            },
            required: ["path"],
            additionalProperties: false,
        },
    },
    {
        name: "list_sections",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        title: "List sections",
        description: skillDescription("list_sections"),
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "list_recent",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        title: "List recent content",
        description: skillDescription("list_recent"),
        inputSchema: {
            type: "object",
            properties: {
                section: {
                    type: "string",
                    enum: SECTION_SLUGS,
                    description: "Only this section. Omit for all sections.",
                },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: RECENT_LIMIT.max,
                    default: RECENT_LIMIT.fallback,
                    description: "Maximum items to return.",
                },
            },
            additionalProperties: false,
        },
    },
];

function rpcResult(id: unknown, result: unknown) {
    return json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: unknown, code: number, message: string, data?: unknown) {
    return json({ jsonrpc: "2.0", id, error: { code, message, data } });
}

const CORS_HEADERS = {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "content-type, mcp-protocol-version, mcp-session-id",
    "Access-Control-Expose-Headers": "mcp-session-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(payload: unknown, status = 200, extra: Record<string, string> = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...CORS_HEADERS,
            ...extra,
        },
    });
}

function textResult(text: string) {
    return { content: [{ type: "text", text }] };
}

async function callTool(name: string, args: Record<string, unknown>) {
    switch (name) {
        case "search_site": {
            const query = String(args.query ?? "");
            const hits = await searchContent(query, boundedInt(args.limit, SEARCH_LIMIT));
            if (hits.length === 0) {
                return textResult(`No results for "${query}".`);
            }
            return textResult(
                hits
                    .map(
                        (h) =>
                            `## ${h.title}\n${h.section} · ${h.published.slice(0, 10)}\n${h.excerpt}\nHTML: ${h.url}\nMarkdown: ${h.markdownUrl}`,
                    )
                    .join("\n\n"),
            );
        }
        case "get_document": {
            const doc = await getDocument(String(args.path ?? ""));
            if (!doc) {
                return {
                    ...textResult(
                        `No document found for "${args.path}". Use search_site or list_recent to find valid paths.`,
                    ),
                    isError: true,
                };
            }
            const body = await resolveEmbedsForMarkdown(doc.body);
            return textResult(composeDocumentMarkdown(doc, body, SITE_ORIGIN));
        }
        case "list_sections": {
            const sections = await listSections();
            return textResult(
                sections
                    .map(
                        (s) =>
                            `- ${s.slug} — ${s.name} (${s.entries} entries)${s.description ? `: ${s.description}` : ""}`,
                    )
                    .join("\n"),
            );
        }
        case "list_recent": {
            const section = args.section ? String(args.section) : undefined;
            if (section && !(SECTION_SLUGS as readonly string[]).includes(section)) {
                return {
                    ...textResult(
                        `Unknown section "${section}". Use one of: ${SECTION_SLUGS.join(", ")}, or omit it for all sections.`,
                    ),
                    isError: true,
                };
            }
            const items = await listContent({
                section,
                limit: boundedInt(args.limit, RECENT_LIMIT),
            });
            return textResult(
                items
                    .map(
                        (i) =>
                            `- ${i.published.slice(0, 10)} [${i.section}] ${i.title} — ${i.markdownUrl}`,
                    )
                    .join("\n"),
            );
        }
        default:
            return { ...textResult(`Unknown tool: ${name}`), isError: true };
    }
}

function initializeResult() {
    return {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false, subscribe: false },
        },
        serverInfo: {
            name: SITE_IDENTITY.name,
            title: SITE_IDENTITY.title,
            version: "1.0.0",
        },
        instructions:
            "Content from Matthias Jordan's personal site: essays on building software, photography and generative art with process notes, and tested recipes. Search first, then fetch a document for its full markdown. Everything is public — no credentials needed.",
    };
}

export const OPTIONS: APIRoute = () =>
    new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = ({ request }) => {
    if ((request.headers.get("accept") ?? "").includes("text/event-stream")) {
        return new Response(null, {
            status: 405,
            headers: {
                Allow: "POST, OPTIONS",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
    return json({
        name: SITE_IDENTITY.name,
        description: SITE_IDENTITY.summary,
        protocolVersion: MCP_PROTOCOL_VERSION,
        transport: "streamable-http",
        serverUrl: `${SITE_ORIGIN}/mcp`,
        authentication: "none",
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    });
};

export const POST: APIRoute = async ({ request }) => {
    let parsed: unknown;
    try {
        parsed = await request.json();
    } catch {
        return rpcError(null, -32700, "Parse error: body is not valid JSON");
    }
    if (!isJsonObject(parsed)) {
        return rpcError(null, -32600, "Invalid request: expected one JSON-RPC object");
    }
    if (isJsonRpcNotification(parsed)) {
        return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    const id = parsed.id ?? null;
    const method = typeof parsed.method === "string" ? parsed.method : "";
    const params = isJsonObject(parsed.params) ? parsed.params : {};
    if (!method) return rpcError(id, -32600, "Invalid request: missing method");

    switch (method) {
        case "initialize":
            return json(
                {
                    jsonrpc: "2.0",
                    id,
                    result: initializeResult(),
                },
                200,
                { "Mcp-Session-Id": crypto.randomUUID() },
            );

        case "ping":
            return rpcResult(id, {});

        case "tools/list":
            return rpcResult(id, { tools: TOOLS });

        case "tools/call": {
            const name = String(params.name ?? "");
            const args = (params.arguments ?? {}) as Record<string, unknown>;
            if (!TOOLS.some((t) => t.name === name)) {
                return rpcError(id, -32602, `Unknown tool: ${name}`, {
                    available: TOOLS.map((t) => t.name),
                });
            }
            try {
                return rpcResult(id, await callTool(name, args));
            } catch (err) {
                return rpcResult(id, {
                    ...textResult(
                        `${name} failed: ${err instanceof Error ? err.message : String(err)}. This is usually a temporary upstream error; retry once, or read ${SITE_ORIGIN}/llms-full.txt instead.`,
                    ),
                    isError: true,
                });
            }
        }

        case "resources/list":
            return rpcResult(id, { resources: RESOURCES });

        case "resources/read": {
            const uri = String(params.uri ?? "");
            const res = RESOURCES.find((r) => r.uri === uri);
            if (!res) {
                return rpcError(id, -32602, `Unknown resource: ${uri}`, {
                    available: RESOURCES.map((r) => r.uri),
                });
            }
            return rpcResult(id, {
                contents: [
                    {
                        uri,
                        mimeType: res.mimeType,
                        text: await res.load(),
                    },
                ],
            });
        }

        case "prompts/list":
            return rpcResult(id, { prompts: [] });

        default:
            return rpcError(id, -32601, `Method not found: ${method}`);
    }
};
