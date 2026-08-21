// GraphQL schema for the site's content.
//
// Why GraphQL alongside the REST endpoints: an agent asking "what has
// he written about X, and give me the bodies" needs two REST round
// trips (search, then fetch each hit). One GraphQL query does it, and
// the typed schema tells the agent what's available without reading
// prose docs.
//
// Conventions, all of them the ones agents already recognize:
//   - Relay connections (edges/node/pageInfo, cursor pagination)
//   - errors modeled IN the schema via result unions, not only the
//     transport-level `errors` array
//   - @deprecated with a reason on anything retiring
//   - introspection deliberately public — this is public content, and
//     an auth-gated schema is unusable for discovery

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
    listContent,
    listSections,
    searchContent,
    type ContentItem,
} from "./agent-data";
import { resolveEmbedsForMarkdown } from "./markdown-view";
import { SITE_ORIGIN } from "./agent-surface";

/** Cursors are opaque by contract; base64 of the offset in practice. */
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
    values: {
        art: { value: "art" },
        posts: { value: "posts" },
        recipes: { value: "recipes" },
        melange: { value: "melange" },
        open_source: { value: "open-source" },
    },
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
            // The data layer calls this `entries`; the schema uses the
            // clearer name and maps it here.
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

/** Errors modeled in the schema so a client handles them by type. */
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

export const schema = new GraphQLSchema({
    description:
        "Read-only access to the published content of iammatthias.com. Public and unauthenticated. Every list is a Relay connection; every document carries a cid you can cache against.",
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
                        description:
                            "Path or slug, e.g. 'posts/1779066375000-farfield'.",
                    },
                },
                resolve: async (_r, { path }) => {
                    const items = await listContent({ limit: 1000 });
                    const clean = String(path)
                        .replace(/^https?:\/\/[^/]+/, "")
                        .replace(/^\/|\.md$/g, "");
                    const hit =
                        items.find((i) => `${i.section}/${i.slug}` === clean) ??
                        items.find((i) => i.slug === clean.split("/").pop());
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
