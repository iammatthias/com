// Single source of truth for the site's agent-facing surface.
//
// Every machine-readable artifact the site publishes — the MCP tools,
// the OpenAPI operations, the well-known discovery documents, the
// developer page — is generated from the declarations here, so the
// catalog can never drift from what actually answers. scripts/
// agent-check.mjs validates the built site against this same list.
//
// Honesty rule for anything added here: describe only capabilities
// that exist. An agent that trusts a fabricated catalog entry wastes
// a request and learns not to trust the rest of it.

export const SITE_ORIGIN = "https://iammatthias.com";

export const SITE_IDENTITY = {
    name: "iammatthias.com",
    title: "iammatthias",
    owner: "Matthias Jordan",
    email: "hey@iammatthias.com",
    /** The human-facing one-liner (site chrome, RSS, llms.txt). */
    tagline:
        "Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.",
    summary:
        "A personal site: photography, generative art, essays on building software, and tested recipes. Content is public, free, and served as both HTML and markdown.",
    repo: "https://github.com/iammatthias/com",
} as const;

/** Publication slugs — scoped llms.txt files, filters, descriptions. */
export const SECTION_SLUGS = [
    "art",
    "posts",
    "recipes",
    "melange",
    "open-source",
] as const;

/** A real, published document used as the example in every surface
 *  that needs one (quickstarts, tool descriptions, GraphQL docs).
 *  One constant so an unpublish/re-slug breaks one place, not six. */
export const EXAMPLE_DOC_PATH = "posts/1779066375000-farfield";

/** The robots.txt Content-Signal policy, also quoted on /developers. */
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

/**
 * Answer-engine and agent crawlers, by User-Agent token. Two
 * consumers: robots.txt welcomes them explicitly, and the middleware
 * serves them markdown when they did not ask for a representation.
 */
export const AGENT_CRAWLERS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "DeepSeekBot",
    "ora-agent",
    "DuckAssistBot",
] as const;

/** Welcome in robots.txt but deliberately NOT served markdown — a
 *  classic search indexer whose results page links humans to HTML. */
export const SEARCH_ONLY_CRAWLERS = ["Bingbot"] as const;

/** MCP protocol revision the transport negotiates and the discovery
 *  documents advertise. */
export const MCP_PROTOCOL_VERSION = "2025-06-18";

/** Public HTTP endpoints, mirrored into /openapi.json. */
export interface ApiOperation {
    path: string;
    operationId: string;
    summary: string;
    description: string;
    /** Response media type. */
    contentType: string;
    params?: Array<{
        name: string;
        in: "query";
        required: boolean;
        schema: { type: string; enum?: string[] };
        description: string;
    }>;
}

export const API_OPERATIONS: ApiOperation[] = [
    {
        path: "/api/search-corpus.json",
        operationId: "getSearchCorpus",
        summary: "Full searchable corpus",
        description:
            "Every searchable item on the site (documents and feed posts) as compact text, each carrying its Farfield content hash (cid). Intended for building your own index; the site's own search embeds this locally in the browser.",
        contentType: "application/json",
    },
    {
        path: "/api/search-vectors.json",
        operationId: "getSearchVectors",
        summary: "Prebuilt embedding vectors",
        description:
            "Precomputed embedding vectors for the corpus, keyed by cid, with the model name and dimension count. Built at deploy time with the ternlight model.",
        contentType: "application/json",
    },
    {
        path: "/api/content.json",
        operationId: "listContent",
        summary: "List published documents",
        description:
            "Every published document as structured JSON: title, section, tags, dates, content hash, canonical URL, and markdown URL. Filterable by section and tag.",
        contentType: "application/json",
        params: [
            {
                name: "section",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: `Restrict to one publication slug (${SECTION_SLUGS.join(", ")}).`,
            },
            {
                name: "tag",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Restrict to documents carrying this tag.",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer" },
                description: "Maximum number of items to return (default 100).",
            },
        ],
    },
    {
        path: "/api/search.json",
        operationId: "searchContent",
        summary: "Keyword search across the site",
        description:
            "Ranked keyword search over titles, excerpts, tags, and body text of every published document and feed post. Returns canonical and markdown URLs per hit.",
        contentType: "application/json",
        params: [
            {
                name: "q",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Search terms.",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer" },
                description: "Maximum number of hits (default 10, max 50).",
            },
        ],
    },
];

/** MCP tools, mirrored into the server card and the skills index. */
export interface AgentSkill {
    name: string;
    title: string;
    description: string;
}

export const AGENT_SKILLS: AgentSkill[] = [
    {
        name: "search_site",
        title: "Search the site",
        description:
            "Search Matthias Jordan's writing, photography notes, and recipes by keyword. Returns titles, excerpts, and both HTML and markdown URLs.",
    },
    {
        name: "get_document",
        title: "Read one document",
        description:
            "Fetch the full markdown source of one document by its path or slug, with front matter (title, dates, tags, content hash) and images resolved to public URLs.",
    },
    {
        name: "list_sections",
        title: "List sections",
        description: `List the site's publications (${SECTION_SLUGS.join(", ")}) with descriptions and entry counts.`,
    },
    {
        name: "list_recent",
        title: "List recent content",
        description:
            "List the most recently published documents, newest first, optionally filtered to one section.",
    },
];

/**
 * The MCP server card. One builder for every document that describes
 * the server (/.well-known/mcp, its server-card.json) — hand-kept
 * copies had already drifted apart.
 */
export function mcpServerCard(serverUrl: string) {
    return {
        name: SITE_IDENTITY.name,
        title: `${SITE_IDENTITY.title} content`,
        description: SITE_IDENTITY.summary,
        version: "1.0.0",
        serverUrl,
        transport: "streamable-http",
        protocolVersion: MCP_PROTOCOL_VERSION,
        authentication: { type: "none" },
        provider: { name: SITE_IDENTITY.owner, url: SITE_ORIGIN },
        documentationUrl: `${SITE_ORIGIN}/developers`,
        tools: AGENT_SKILLS.map((skill) => ({
            name: skill.name,
            title: skill.title,
            description: skill.description,
        })),
    };
}

// Only list resources that exist and answer. An entry pointing at a
// 404 teaches an agent the whole catalog is unreliable — scripts/
// agent-check.mjs walks every URL here on live runs for exactly that
// reason.

/** Machine-readable resources, mirrored into the ARD ai-catalog. */
export const AGENT_RESOURCES = [
    {
        id: "llms-txt",
        type: "documentation",
        name: "llms.txt site map",
        description:
            "Index of every published document with links to its markdown twin.",
        url: `${SITE_ORIGIN}/llms.txt`,
        mediaType: "text/markdown",
    },
    {
        id: "llms-full",
        type: "documentation",
        name: "Full corpus in one file",
        description:
            "Every published document, front matter included, in a single markdown file.",
        url: `${SITE_ORIGIN}/llms-full.txt`,
        mediaType: "text/markdown",
    },
    {
        id: "mcp",
        type: "mcp-server",
        name: "iammatthias.com MCP server",
        description:
            "Streamable HTTP MCP server exposing site search and document retrieval as tools. No authentication required.",
        url: `${SITE_ORIGIN}/mcp`,
        mediaType: "application/json",
    },
    {
        id: "graphql",
        type: "graphql",
        name: "GraphQL endpoint",
        description:
            "Typed, introspectable GraphQL over the same content: search, list, and read documents in one round trip. Relay connections, schema-modeled errors, no authentication.",
        url: `${SITE_ORIGIN}/graphql`,
        mediaType: "application/json",
    },
    {
        id: "graphql-sdl",
        type: "schema",
        name: "GraphQL schema (SDL)",
        description:
            "The GraphQL schema as SDL, for codegen or reading without an introspection query.",
        url: `${SITE_ORIGIN}/schema.graphql`,
        mediaType: "text/plain",
    },
    {
        id: "openapi",
        type: "openapi",
        name: "OpenAPI specification",
        description:
            "OpenAPI 3.1 description of the site's public read-only JSON endpoints.",
        url: `${SITE_ORIGIN}/openapi.json`,
        mediaType: "application/json",
    },
    {
        id: "sitemap",
        type: "sitemap",
        name: "XML sitemap",
        description: "Every indexable URL with last-modified dates.",
        url: `${SITE_ORIGIN}/sitemap.xml`,
        mediaType: "application/xml",
    },
    {
        id: "feed",
        type: "feed",
        name: "RSS feed",
        description:
            "Sitewide RSS with full article bodies; per-section feeds at /<section>/rss.xml.",
        url: `${SITE_ORIGIN}/rss.xml`,
        mediaType: "application/rss+xml",
    },
] as const;
