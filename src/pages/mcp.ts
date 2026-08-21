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
import { AGENT_SKILLS, SITE_IDENTITY, SITE_ORIGIN } from "@lib/agent-surface";

const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
    {
        name: "search_site",
        title: "Search the site",
        description: AGENT_SKILLS[0].description,
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
        title: "Read one document",
        description: AGENT_SKILLS[1].description,
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description:
                        "Document path or slug, e.g. 'posts/1779066375000-farfield' or a full URL.",
                },
            },
            required: ["path"],
        },
    },
    {
        name: "list_sections",
        title: "List sections",
        description: AGENT_SKILLS[2].description,
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "list_recent",
        title: "List recent content",
        description: AGENT_SKILLS[3].description,
        inputSchema: {
            type: "object",
            properties: {
                section: {
                    type: "string",
                    description:
                        "Optional section slug: art, posts, recipes, melange, open-source.",
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

function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type, mcp-protocol-version",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

export const OPTIONS: APIRoute = () => json({}, 204);

/** GET returns the server card — useful in a browser, and a valid
 *  discovery response for agents that probe before connecting. */
export const GET: APIRoute = () =>
    json({
        name: SITE_IDENTITY.name,
        description: SITE_IDENTITY.summary,
        protocolVersion: PROTOCOL_VERSION,
        transport: "streamable-http",
        serverUrl: `${SITE_ORIGIN}/mcp`,
        authentication: "none",
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    });

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
            return rpcResult(id, {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: { tools: { listChanged: false } },
                serverInfo: {
                    name: SITE_IDENTITY.name,
                    title: SITE_IDENTITY.title,
                    version: "1.0.0",
                },
                instructions:
                    "Content from Matthias Jordan's personal site: essays on building software, photography and generative art with process notes, and tested recipes. Search first, then fetch a document for its full markdown. Everything is public — no credentials needed.",
            });

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
            return rpcResult(id, { resources: [] });

        case "prompts/list":
            return rpcResult(id, { prompts: [] });

        default:
            return rpcError(id, -32601, `Method not found: ${method}`);
    }
};
