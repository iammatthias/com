import { getCollection } from "astro:content";
import {
    unstampSlug,
    type DocumentData,
    type PublicationData,
} from "./farfield-loader";
import { plainText } from "./markdown-text";
import { words } from "./text-fold";
import { publishedDocs } from "./content-query";
import { SITE_ORIGIN } from "./agent-surface";

export interface ContentItem {
    title: string;
    section: string;
    slug: string;
    excerpt: string;
    tags: string[];
    published: string;
    updated: string;
    cid: string;
    url: string;
    markdownUrl: string;
}

const plainTextByCid = new Map<string, string>();

function bodyText(d: DocumentData): string {
    let text = plainTextByCid.get(d.cid);
    if (text === undefined) {
        text = plainText(d.body);
        plainTextByCid.set(d.cid, text);
    }
    return text;
}

function toItem(d: DocumentData): ContentItem {
    return {
        title: d.title,
        section: d.collection,
        slug: d.rkey,
        excerpt: d.description || bodyText(d).slice(0, 200).trim(),
        tags: d.tags,
        published: d.publishedAt,
        updated: d.updatedAt,
        cid: d.cid,
        url: `${SITE_ORIGIN}${d.href}`,
        markdownUrl: `${SITE_ORIGIN}${d.href}.md`,
    };
}

const allDocuments = publishedDocs;

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

interface SearchHit extends ContentItem {
    score: number;
}

const TITLE_MATCH_SCORE = 10;
const TAG_MATCH_SCORE = 5;
const MAX_BODY_MATCHES_COUNTED = 5;
export const MAX_SEARCH_LIMIT = 50;

export async function searchContent(
    query: string,
    limit = 10,
): Promise<SearchHit[]> {
    const terms = [...new Set(words(query))].filter((t) => t.length > 1);
    if (terms.length === 0) return [];

    const docs = await allDocuments();
    const hits: SearchHit[] = [];
    for (const d of docs) {
        const title = new Set(words(d.title));
        const tags = new Set(words(d.tags.join(" ")));
        const body = new Map<string, number>();
        for (const w of words(bodyText(d))) body.set(w, (body.get(w) ?? 0) + 1);
        let score = 0;
        for (const term of terms) {
            if (title.has(term)) score += TITLE_MATCH_SCORE;
            if (tags.has(term)) score += TAG_MATCH_SCORE;
            score += Math.min(body.get(term) ?? 0, MAX_BODY_MATCHES_COUNTED);
        }
        if (score > 0) hits.push({ ...toItem(d), score });
    }
    hits.sort(
        (a, b) => b.score - a.score || b.published.localeCompare(a.published),
    );
    return hits.slice(0, Math.max(1, Math.min(limit, MAX_SEARCH_LIMIT)));
}

export async function getDocument(
    ref: string,
): Promise<DocumentData | undefined> {
    const sectionAndSlug = ref
        .replace(/^https?:\/\/[^/]+/, "")
        .replace(/^\/|\.md$/g, "");
    const slug = sectionAndSlug.includes("/")
        ? sectionAndSlug.split("/").pop()!
        : sectionAndSlug;
    const docs = await allDocuments();
    return (
        docs.find((d) => `${d.collection}/${d.rkey}` === sectionAndSlug) ??
        docs.find(
            (d) => `${d.collection}/${unstampSlug(d.rkey)}` === sectionAndSlug,
        ) ??
        docs.find((d) => d.rkey === slug) ??
        docs.find((d) => unstampSlug(d.rkey) === slug)
    );
}

export async function getContentItem(
    ref: string,
): Promise<ContentItem | undefined> {
    const doc = await getDocument(ref);
    return doc && toItem(doc);
}
