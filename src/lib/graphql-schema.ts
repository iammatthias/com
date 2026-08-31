
import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLUnionType,
} from "graphql";
import {
    getDocument,
    getContentItem,
    listContent,
    listSections,
    searchContent,
    type ContentItem,
} from "./agent-data";
import { resolveEmbedsForMarkdown } from "./markdown-view";
import { SITE_ORIGIN, SECTION_SLUGS, EXAMPLE_DOC_PATH } from "./agent-surface";

const encodeCursor = (i: number) => btoa(`offset:${i}`);
const decodeCursor = (c: string): number => {
    try {
        const m = /^offset:(\d+)$/.exec(atob(c));
        return m ? Number(m[1]) : 0;
    } catch {
        return 0;
    }
};

const SectionSlug = new GraphQLEnumType({
    name: "SectionSlug",
    description: "A publication on the site.",
    values: Object.fromEntries(
        SECTION_SLUGS.map((s) => [s.replace(/-/g, "_"), { value: s }]),
    ),
});

const Section = new GraphQLObjectType({
    name: "Section",
    description: "A publication: a group of documents sharing a subject.",
    fields: () => ({
        slug: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
        entryCount: {
            type: new GraphQLNonNull(GraphQLInt),
            description: "Number of published documents in this section.",
            resolve: (s: { entries: number }) => s.entries,
        },
        url: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: (s) => `${SITE_ORIGIN}/${s.slug}`,
        },
        markdownIndexUrl: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Markdown index of this section.",
            resolve: (s) => `${SITE_ORIGIN}/${s.slug}.md`,
        },
    }),
});

const Document = new GraphQLObjectType({
    name: "Document",
    description:
        "One published piece: an essay, photo series, or recipe. Identified by its content hash (cid), which changes only when the content does.",
    fields: () => ({
        cid: {
            type: new GraphQLNonNull(GraphQLString),
            description:
                "CIDv1 content hash. Stable for identical content — cache against this.",
        },
        slug: { type: new GraphQLNonNull(GraphQLString) },
        id: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Former alias for `cid`.",
            deprecationReason:
                "Renamed to `cid` to match the rest of the API. Retained until 2027-01-01; use `cid`.",
            resolve: (item: ContentItem) => item.cid,
        },
        title: { type: new GraphQLNonNull(GraphQLString) },
        section: { type: new GraphQLNonNull(GraphQLString) },
        excerpt: { type: new GraphQLNonNull(GraphQLString) },
        tags: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        publishedAt: { type: new GraphQLNonNull(GraphQLString) },
        updatedAt: { type: new GraphQLNonNull(GraphQLString) },
        url: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Canonical HTML URL.",
        },
        markdownUrl: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Markdown twin of the canonical URL.",
        },
        body: {
            type: GraphQLString,
            description:
                "Full markdown source with image embeds resolved to public URLs. Costs one extra resolution per document — request it only for documents you intend to read.",
            resolve: async (item: ContentItem) => {
                const doc = await getDocument(`${item.section}/${item.slug}`);
                return doc ? await resolveEmbedsForMarkdown(doc.body) : null;
            },
        },
    }),
});

const PageInfo = new GraphQLObjectType({
    name: "PageInfo",
    description: "Relay-style pagination state.",
    fields: {
        hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
        hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
        startCursor: { type: GraphQLString },
        endCursor: { type: GraphQLString },
    },
});

const DocumentEdge = new GraphQLObjectType({
    name: "DocumentEdge",
    fields: {
        cursor: { type: new GraphQLNonNull(GraphQLString) },
        node: { type: new GraphQLNonNull(Document) },
        relevance: {
            type: GraphQLInt,
            description: "Search score; null outside search results.",
        },
    },
});

const DocumentConnection = new GraphQLObjectType({
    name: "DocumentConnection",
    fields: {
        edges: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DocumentEdge))),
        },
        nodes: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Document))),
            description: "Shortcut past edges when you don't need cursors.",
        },
        pageInfo: { type: new GraphQLNonNull(PageInfo) },
        totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    },
});

const QueryError = new GraphQLObjectType({
    name: "QueryError",
    description: "A request that failed on its own terms, not in transport.",
    fields: {
        code: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Machine-readable code, e.g. NOT_FOUND, INVALID_ARGUMENT.",
        },
        message: { type: new GraphQLNonNull(GraphQLString) },
        resolution: {
            type: GraphQLString,
            description: "How to change the request and retry.",
        },
    },
});

const DocumentResult = new GraphQLUnionType({
    name: "DocumentResult",
    description: "Either the document, or a typed error explaining why not.",
    types: [Document, QueryError],
    resolveType: (v) => ("cid" in v ? "Document" : "QueryError"),
});

function connect(items: ContentItem[], after?: string | null, first = 20) {
    const start = after ? decodeCursor(after) + 1 : 0;
    const slice = items.slice(start, start + Math.min(first, 100));
    return {
        totalCount: items.length,
        nodes: slice,
        edges: slice.map((node, i) => ({
            node,
            cursor: encodeCursor(start + i),
            relevance: (node as ContentItem & { score?: number }).score ?? null,
        })),
        pageInfo: {
            hasNextPage: start + slice.length < items.length,
            hasPreviousPage: start > 0,
            startCursor: slice.length ? encodeCursor(start) : null,
            endCursor: slice.length ? encodeCursor(start + slice.length - 1) : null,
        },
    };
}

const connectionArgs = {
    first: {
        type: GraphQLInt,
        description: "Items to return (default 20, max 100).",
        defaultValue: 20,
    },
    after: {
        type: GraphQLString,
        description: "Opaque cursor from a previous pageInfo.endCursor.",
    },
};

const COST_NOTE =
    "Cost model: each connection returns at most 100 items (`first` is clamped). Field resolution is O(1) except `Document.body`, which resolves image embeds per document — request it only for documents you intend to read. Rate limits are Cloudflare's edge defaults, advertised on REST responses via the RateLimit header; there is no per-client quota or API key.";

export const schema = new GraphQLSchema({
    description:
        "Read-only access to the published content of iammatthias.com. Public and unauthenticated. Every list is a Relay connection; every document carries a cid you can cache against. " +
        COST_NOTE,
    query: new GraphQLObjectType({
        name: "Query",
        fields: {
            search: {
                type: new GraphQLNonNull(DocumentConnection),
                description:
                    "Keyword search across titles, tags, and bodies, ranked by relevance.",
                args: {
                    query: {
                        type: new GraphQLNonNull(GraphQLString),
                        description: "Search terms.",
                    },
                    ...connectionArgs,
                },
                resolve: async (_r, { query, first, after }) =>
                    connect(await searchContent(query, 100), after, first),
            },
            documents: {
                type: new GraphQLNonNull(DocumentConnection),
                description: "All published documents, newest first.",
                args: {
                    section: {
                        type: SectionSlug,
                        description: "Restrict to one publication.",
                    },
                    tag: { type: GraphQLString, description: "Restrict to one tag." },
                    ...connectionArgs,
                },
                resolve: async (_r, { section, tag, first, after }) =>
                    connect(
                        await listContent({ section, tag, limit: 500 }),
                        after,
                        first,
                    ),
            },
            document: {
                type: new GraphQLNonNull(DocumentResult),
                description: "One document by path or slug.",
                args: {
                    path: {
                        type: new GraphQLNonNull(GraphQLString),
                        description: `Path or slug, e.g. '${EXAMPLE_DOC_PATH}'.`,
                    },
                },
                resolve: async (_r, { path }) => {
                    const hit = await getContentItem(String(path));
                    return (
                        hit ?? {
                            code: "NOT_FOUND",
                            message: `No document at "${path}".`,
                            resolution:
                                "Use search(query:) or documents() to find a valid path, or fetch /llms.txt for the full index.",
                        }
                    );
                },
            },
            sections: {
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Section))),
                description: "Every publication with its entry count.",
                resolve: () => listSections(),
            },
        },
    }),
});
