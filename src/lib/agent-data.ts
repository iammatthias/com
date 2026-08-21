// Shared query layer behind the agent-facing surfaces (/api/*.json and
// the MCP tools). One implementation so the HTTP API and the MCP tools
// can never disagree about what the site contains.

import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "./farfield-loader";
import { plainText } from "./markdown-text";
import { SITE_ORIGIN } from "./agent-surface";

export interface ContentItem {
    title: string;
    section: string;
    slug: string;
    excerpt: string;
    tags: string[];
    published: string;
    updated: string;
    /** Farfield content hash — stable identifier for this exact text. */
    cid: string;
    url: string;
    markdownUrl: string;
}

function toItem(d: DocumentData): ContentItem {
    return {
        title: d.title,
        section: d.collection,
        slug: d.rkey,
        excerpt: d.description || plainText(d.body).slice(0, 200).trim(),
        tags: d.tags,
        published: d.publishedAt,
        updated: d.updatedAt,
        cid: d.cid,
        url: `${SITE_ORIGIN}${d.href}`,
        markdownUrl: `${SITE_ORIGIN}${d.href}.md`,
    };
}

export async function allDocuments(): Promise<DocumentData[]> {
    return (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function listContent(opts: {
    section?: string;
    tag?: string;
    limit?: number;
} = {}): Promise<ContentItem[]> {
    let docs = await allDocuments();
    if (opts.section) docs = docs.filter((d) => d.collection === opts.section);
    if (opts.tag) docs = docs.filter((d) => d.tags.includes(opts.tag));
    return docs.slice(0, opts.limit ?? 100).map(toItem);
}

export async function listSections(): Promise<
    Array<{ slug: string; name: string; description?: string; entries: number }>
> {
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const docs = await allDocuments();
    return pubs.map((p) => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        entries: docs.filter((d) => d.collection === p.slug).length,
    }));
}

export interface SearchHit extends ContentItem {
    score: number;
}

/**
 * Keyword search across titles, excerpts, tags, and bodies. Plain
 * scoring rather than embeddings: this runs at build time and inside
 * the MCP handler, where the wasm model isn't available (the browser
 * search uses the vector path instead — see scripts/menu-search.ts).
 */
export async function searchContent(
    query: string,
    limit = 10,
): Promise<SearchHit[]> {
    const terms = query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1);
    if (terms.length === 0) return [];

    const docs = await allDocuments();
    const hits: SearchHit[] = [];
    for (const d of docs) {
        const title = d.title.toLowerCase();
        const tags = d.tags.join(" ").toLowerCase();
        const body = plainText(d.body).toLowerCase();
        let score = 0;
        for (const t of terms) {
            if (title.includes(t)) score += 10;
            if (tags.includes(t)) score += 5;
            const n = body.split(t).length - 1;
            score += Math.min(n, 5);
        }
        if (score > 0) hits.push({ ...toItem(d), score });
    }
    hits.sort((a, b) => b.score - a.score || b.published.localeCompare(a.published));
    return hits.slice(0, Math.min(limit, 50));
}

export async function getDocument(
    ref: string,
): Promise<DocumentData | undefined> {
    // Accepts "posts/slug", "/posts/slug", "/posts/slug.md", or a bare slug.
    const clean = ref.replace(/^https?:\/\/[^/]+/, "").replace(/^\/|\.md$/g, "");
    const slug = clean.includes("/") ? clean.split("/").pop()! : clean;
    const docs = await allDocuments();
    return (
        docs.find((d) => `${d.collection}/${d.rkey}` === clean) ??
        docs.find((d) => d.rkey === slug)
    );
}
