import type { Ctx, Route } from "./context";
import { listContent, listSections, searchContent, getDocument, MAX_SEARCH_LIMIT } from "../lib/agent-data";
import { boundedInt, isJsonObject, isJsonRpcNotification } from "../lib/tool-args";
import { composeDocumentMarkdown, resolveEmbedsForMarkdown } from "../lib/markdown-view";
import {
    AGENT_SKILLS,
    EXAMPLE_DOC_PATH,
    MCP_PROTOCOL_VERSION,
    MCP_SUPPORTED_PROTOCOL_VERSIONS,
    SECTION_SLUGS,
    SITE_IDENTITY,
    SITE_ORIGIN,
    mcpServerCard,
} from "../lib/agent-surface";
import { homepageMarkdown, developersMarkdown, authMarkdown, pricingMarkdown } from "../lib/agent-markdown";

/** Ported from com/src/pages/mcp.ts, plus protocol negotiation, batches, and SSE replies. */

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
        description: "How to authenticate (you don't — everything here is public and anonymous).",
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

const READ_ONLY = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
};

export const TOOLS = [
    {
        name: "search_site",
        title: "Search the site",
        description: skillDescription("search_site"),
        annotations: READ_ONLY,
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
        annotations: READ_ONLY,
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
        annotations: READ_ONLY,
        title: "List sections",
        description: skillDescription("list_sections"),
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "list_recent",
        annotations: READ_ONLY,
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

const CORS_HEADERS = {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
    "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

type RpcMessage = Record<string, unknown>;

function textResult(text: string) {
    return { content: [{ type: "text", text }] };
}

async function callTool(name: string, args: Record<string, unknown>) {
    switch (name) {
        case "search_site": {
            const query = String(args.query ?? "");
            const hits = await searchContent(query, boundedInt(args.limit, SEARCH_LIMIT));
            if (hits.length === 0) return textResult(`No results for "${query}".`);
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
            const items = await listContent({ section, limit: boundedInt(args.limit, RECENT_LIMIT) });
            return textResult(
                items
                    .map((i) => `- ${i.published.slice(0, 10)} [${i.section}] ${i.title} — ${i.markdownUrl}`)
                    .join("\n"),
            );
        }
        default:
            return { ...textResult(`Unknown tool: ${name}`), isError: true };
    }
}

/** Echo the client's version when we speak it; otherwise offer our latest (spec: lifecycle/version negotiation). */
export function negotiateProtocol(requested: unknown): string {
    return typeof requested === "string" &&
        (MCP_SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
        ? requested
        : MCP_PROTOCOL_VERSION;
}

function initializeResult(params: RpcMessage) {
    return {
        protocolVersion: negotiateProtocol(params.protocolVersion),
        capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false, subscribe: false },
            prompts: { listChanged: false },
        },
        serverInfo: {
            name: SITE_IDENTITY.name,
            title: SITE_IDENTITY.title,
            version: "1.0.0",
            websiteUrl: SITE_ORIGIN,
        },
        instructions:
            "Content from Matthias Jordan's personal site: essays on building software, photography and generative art with process notes, and tested recipes. Search first, then fetch a document for its full markdown. Everything is public — no credentials needed.",
    };
}

const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string, data?: unknown) => ({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data !== undefined && { data }) },
});

async function handleMessage(msg: unknown): Promise<RpcMessage | null> {
    if (!isJsonObject(msg)) return rpcError(null, -32600, "Invalid request: expected a JSON-RPC object");
    if (isJsonRpcNotification(msg)) return null;
    const id = msg.id ?? null;
    if (!("method" in msg) && ("result" in msg || "error" in msg)) return null;
    const method = typeof msg.method === "string" ? msg.method : "";
    const params = isJsonObject(msg.params) ? msg.params : {};
    if (!method) return rpcError(id, -32600, "Invalid request: missing method");

    switch (method) {
        case "initialize":
            return rpcResult(id, initializeResult(params));
        case "ping":
            return rpcResult(id, {});
        case "tools/list":
            return rpcResult(id, { tools: TOOLS });
        case "tools/call": {
            const name = String(params.name ?? "");
            const args = (isJsonObject(params.arguments) ? params.arguments : {}) as Record<string, unknown>;
            if (!TOOLS.some((t) => t.name === name)) {
                return rpcError(id, -32602, `Unknown tool: ${name}`, { available: TOOLS.map((t) => t.name) });
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
            return rpcResult(id, {
                resources: RESOURCES.map(({ load: _load, ...r }) => r),
            });
        case "resources/templates/list":
            return rpcResult(id, { resourceTemplates: [] });
        case "resources/read": {
            const uri = String(params.uri ?? "");
            const res = RESOURCES.find((r) => r.uri === uri);
            if (!res) {
                return rpcError(id, -32602, `Unknown resource: ${uri}`, { available: RESOURCES.map((r) => r.uri) });
            }
            return rpcResult(id, { contents: [{ uri, mimeType: res.mimeType, text: await res.load() }] });
        }
        case "prompts/list":
            return rpcResult(id, { prompts: [] });
        case "logging/setLevel":
            return rpcResult(id, {});
        default:
            return rpcError(id, -32601, `Method not found: ${method}`);
    }
}

function wantsEventStream(accept: string): boolean {
    const a = accept.toLowerCase();
    return a.includes("text/event-stream") && !a.includes("application/json") && !a.includes("*/*");
}

function reply(payload: unknown, accept: string, extra: Record<string, string> = {}): Response {
    const json = JSON.stringify(payload);
    if (wantsEventStream(accept)) {
        return new Response(`event: message\ndata: ${json}\n\n`, {
            headers: { "Content-Type": "text/event-stream", ...CORS_HEADERS, ...extra },
        });
    }
    return new Response(json, {
        headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
    });
}

const MAX_BATCH = 20;

export async function mcpPost({ request }: Ctx): Promise<Response> {
    const accept = request.headers.get("accept") ?? "";
    let parsed: unknown;
    try {
        parsed = await request.json();
    } catch {
        return reply(rpcError(null, -32700, "Parse error: body is not valid JSON"), accept);
    }

    const batch = Array.isArray(parsed);
    const messages = batch ? (parsed as unknown[]) : [parsed];
    if (messages.length === 0) {
        return reply(rpcError(null, -32600, "Invalid request: empty batch"), accept);
    }
    // each message may load content: a batch is bounded like any other request
    if (messages.length > MAX_BATCH) {
        return reply(rpcError(null, -32600, `Invalid request: a batch holds at most ${MAX_BATCH} messages`), accept);
    }
    const replies = (await Promise.all(messages.map(handleMessage))).filter(
        (r): r is RpcMessage => r !== null,
    );
    if (replies.length === 0) {
        return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    const init = messages.find(
        (m) => isJsonObject(m) && m.method === "initialize" && !isJsonRpcNotification(m),
    ) as RpcMessage | undefined;
    const extra: Record<string, string> = {};
    if (init) {
        extra["Mcp-Session-Id"] = crypto.randomUUID();
        extra["MCP-Protocol-Version"] = negotiateProtocol(
            isJsonObject(init.params) ? init.params.protocolVersion : undefined,
        );
    }
    return reply(batch ? replies : replies[0], accept, extra);
}

export function mcpOptions(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function sseNotAllowed(): Response {
    return new Response(null, {
        status: 405,
        headers: { Allow: "POST, OPTIONS", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    });
}

export function mcpGet({ request }: Ctx): Response {
    if ((request.headers.get("accept") ?? "").includes("text/event-stream")) return sseNotAllowed();
    return reply(
        {
            name: SITE_IDENTITY.name,
            description: SITE_IDENTITY.summary,
            protocolVersion: MCP_PROTOCOL_VERSION,
            supportedProtocolVersions: MCP_SUPPORTED_PROTOCOL_VERSIONS,
            transport: "streamable-http",
            serverUrl: `${SITE_ORIGIN}/mcp`,
            authentication: "none",
            tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
        },
        "application/json",
    );
}

/** Sessions are stateless; a DELETE is acknowledged so clients can close cleanly. */
function mcpDelete(): Response {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function wellKnownMcpGet({ request }: Ctx): Response {
    if ((request.headers.get("accept") ?? "").includes("text/event-stream")) return sseNotAllowed();
    return new Response(
        JSON.stringify(
            {
                ...mcpServerCard(`${SITE_ORIGIN}/mcp`),
                url: `${SITE_ORIGIN}/mcp`,
                alternativeUrls: [`${SITE_ORIGIN}/.well-known/mcp`],
                serverCard: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
            },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        },
    );
}

export const mcpRoutes: Route[] = [
    { methods: ["POST"], pattern: /^\/(?:\.well-known\/)?mcp$/, handler: mcpPost },
    { methods: ["OPTIONS"], pattern: /^\/(?:\.well-known\/)?mcp$/, handler: mcpOptions },
    { methods: ["DELETE"], pattern: /^\/(?:\.well-known\/)?mcp$/, handler: mcpDelete },
    { methods: ["GET", "HEAD"], pattern: /^\/mcp$/, handler: mcpGet },
    { methods: ["GET", "HEAD"], pattern: /^\/\.well-known\/mcp$/, handler: wellKnownMcpGet },
];
