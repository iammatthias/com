// MCP server (Streamable HTTP transport) for iammatthias.com.
//
// Exposes the site's content as tools so an agent can search and read
// it over the same protocol it uses for everything else, instead of
// scraping HTML. JSON-RPC 2.0 over POST; no authentication, since
// everything it serves is already public.
//
// Implemented directly rather than via the MCP SDK: the transport is
// a handful of JSON-RPC methods, and hand-rolling keeps the worker
// bundle small and free of Node-only dependencies. GET returns the
// server card so a browser (or a curious agent) sees something useful.

export const prerender = false;

import type { APIRoute } from "astro";
import {
    listContent,
    listSections,
    searchContent,
    getDocument,
} from "@lib/agent-data";
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

/**
 * Resources an agent can read without calling a tool — the same
 * documents served at their HTTP URLs, generated from the same
 * functions so the two can't drift. The URI is the canonical URL, so
 * a client can cite what it read.
 */
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

// Descriptions come from AGENT_SKILLS by name — positional indexing
// silently attached the wrong description when the array was reordered.
const skillDescription = (name: string): string => {
    const skill = AGENT_SKILLS.find((s) => s.name === name);
    if (!skill) throw new Error(`AGENT_SKILLS has no entry named ${name}`);
    return skill.description;
};

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
                    description: "Search terms, e.g. 'cloudflare workers' or 'pizza dough'.",
                },
                limit: {
                    type: "integer",
                    description: "Maximum hits to return (1-50, default 10).",
                },
            },
            required: ["query"],
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
                    description: `Document path or slug, e.g. '${EXAMPLE_DOC_PATH}' or a full URL.`,
                },
            },
            required: ["path"],
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
        inputSchema: { type: "object", properties: {} },
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
                    description:
                        `Optional section slug: ${SECTION_SLUGS.join(", ")}.`,
                },
                limit: {
                    type: "integer",
                    description: "Maximum items (default 20).",
                },
            },
        },
    },
];

function rpcResult(id: unknown, result: unknown) {
    return json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: unknown, code: number, message: string, data?: unknown) {
    return json({ jsonrpc: "2.0", id, error: { code, message, data } });
}

function json(payload: unknown, status = 200, extra: Record<string, string> = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
                "content-type, mcp-protocol-version, mcp-session-id",
            "Access-Control-Expose-Headers": "mcp-session-id",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            ...extra,
        },
    });
}

/** Tool results are content blocks; text is what every client renders. */
function textResult(text: string) {
    return { content: [{ type: "text", text }] };
}

async function callTool(name: string, args: Record<string, unknown>) {
    switch (name) {
        case "search_site": {
            const query = String(args.query ?? "");
            const limit = Number(args.limit ?? 10);
            const hits = await searchContent(query, Number.isFinite(limit) ? limit : 10);
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
            const items = await listContent({
                section: args.section ? String(args.section) : undefined,
                limit: Number(args.limit ?? 20),
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

/** The initialize result — its own function so the handler can attach
 *  a session header without duplicating the payload. */
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

export const OPTIONS: APIRoute = () => json({}, 204);

/**
 * GET serves two audiences. A Streamable HTTP client opening the
 * optional server->client SSE stream gets 405: the spec requires
 * either `text/event-stream` or 405, and answering it with JSON is
 * what makes a strict client abort the handshake. Everyone else — a
 * browser, a discovery probe — gets the server card.
 */
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
    let body: {
        jsonrpc?: string;
        id?: unknown;
        method?: string;
        params?: Record<string, unknown>;
    };
    try {
        body = await request.json();
    } catch {
        return rpcError(null, -32700, "Parse error: body is not valid JSON");
    }

    const { id = null, method, params = {} } = body;
    if (!method) return rpcError(id, -32600, "Invalid request: missing method");

    switch (method) {
        case "initialize":
            // The server holds no per-connection state, but clients
            // expect a session id to exist and echo it on later
            // requests — so mint one and accept whatever comes back.
            return json(
                {
                    jsonrpc: "2.0",
                    id,
                    result: initializeResult(),
                },
                200,
                { "Mcp-Session-Id": crypto.randomUUID() },
            );

        case "notifications/initialized":
            return new Response(null, { status: 202 });

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
                return rpcError(id, -32603, "Tool execution failed", {
                    detail: err instanceof Error ? err.message : String(err),
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
