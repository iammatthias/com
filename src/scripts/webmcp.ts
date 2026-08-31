
interface ToolResponse {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
}

interface ModelContext {
    registerTool(tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        annotations?: Record<string, unknown>;
        execute: (args: Record<string, unknown>) => Promise<ToolResponse>;
    }): void;
}

function modelContext(): ModelContext | null {
    const d = document as unknown as { modelContext?: ModelContext };
    const n = navigator as unknown as { modelContext?: ModelContext };
    return d.modelContext ?? n.modelContext ?? null;
}

const text = (t: string): ToolResponse => ({ content: [{ type: "text", text: t }] });
const failure = (t: string): ToolResponse => ({ ...text(t), isError: true });

const READ_ONLY = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
};

export function registerWebMcpTools(): void {
    const ctx = modelContext();
    if (!ctx) return;

    ctx.registerTool({
        name: "search_site",
        description:
            "Search this site's writing, photography notes, and recipes by keyword. Returns titles, excerpts, and both HTML and markdown URLs.",
        annotations: READ_ONLY,
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search terms." },
                limit: {
                    type: "integer",
                    description: "Maximum hits (1-50, default 10).",
                },
            },
            required: ["query"],
        },
        async execute({ query, limit }) {
            const qs = new URLSearchParams({
                q: String(query ?? ""),
                limit: String(limit ?? 10),
            });
            const res = await fetch(`/api/search.json?${qs}`);
            if (!res.ok) {
                const problem = await res.json().catch(() => null);
                return failure(
                    problem?.resolution ?? `Search failed (${res.status}).`,
                );
            }
            const { hits } = await res.json();
            if (!hits.length) return text(`No results for "${query}".`);
            return text(
                hits
                    .map(
                        (h: {
                            title: string;
                            section: string;
                            published: string;
                            excerpt: string;
                            url: string;
                        }) =>
                            `## ${h.title}\n${h.section} · ${h.published.slice(0, 10)}\n${h.excerpt}\n${h.url}`,
                    )
                    .join("\n\n"),
            );
        },
    });

    ctx.registerTool({
        name: "list_content",
        description:
            "List published entries on this site, newest first, optionally filtered to one section (art, posts, recipes, melange, open-source) or one tag.",
        annotations: READ_ONLY,
        inputSchema: {
            type: "object",
            properties: {
                section: { type: "string", description: "Section slug." },
                tag: { type: "string", description: "Tag to filter by." },
                limit: { type: "integer", description: "Maximum items." },
            },
        },
        async execute({ section, tag, limit }) {
            const qs = new URLSearchParams();
            if (section) qs.set("section", String(section));
            if (tag) qs.set("tag", String(tag));
            qs.set("limit", String(limit ?? 25));
            const res = await fetch(`/api/content.json?${qs}`);
            if (!res.ok) return failure(`Listing failed (${res.status}).`);
            const { items } = await res.json();
            return text(
                items
                    .map(
                        (i: { published: string; section: string; title: string; url: string }) =>
                            `- ${i.published.slice(0, 10)} [${i.section}] ${i.title} — ${i.url}`,
                    )
                    .join("\n"),
            );
        },
    });

    ctx.registerTool({
        name: "read_current_page",
        description:
            "Return the markdown source of the page currently open, with front matter and images resolved to public URLs. Cheaper and cleaner than parsing the rendered DOM.",
        annotations: READ_ONLY,
        inputSchema: { type: "object", properties: {} },
        async execute() {
            const path = location.pathname.replace(/\/$/, "");
            const res = await fetch(`${path || "/index"}.md`);
            if (!res.ok) {
                return failure(
                    `This page has no markdown twin. Try search_site, or fetch ${location.origin}/llms.txt for the site index.`,
                );
            }
            return text(await res.text());
        },
    });

    ctx.registerTool({
        name: "open_entry",
        description:
            "Navigate the browser to a specific entry on this site by its path or slug, e.g. 'posts/1779066375000-farfield'.",
        annotations: {
            ...READ_ONLY,
            readOnlyHint: false,
        },
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Entry path or slug." },
            },
            required: ["path"],
        },
        async execute({ path }) {
            const clean = String(path ?? "")
                .replace(/^https?:\/\/[^/]+/, "")
                .replace(/^\/|\.md$/g, "");
            const res = await fetch(`/${clean}.md`, { method: "HEAD" });
            if (!res.ok) {
                return failure(
                    `No entry at "${clean}". Use search_site or list_content to find a valid path.`,
                );
            }
            location.assign(`/${clean}`);
            return text(`Navigating to /${clean}.`);
        },
    });
}
