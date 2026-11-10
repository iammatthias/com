
import { blobURL, getAllSeries, getCollections, getEntries, getPosts, getSeries, getBlobMeta, type BlobMeta, type Collection, type Entry, type Post, type Series } from "./farfield";
import { memo, type MemoOptions } from "./memo";
import { isStampedSlug, unstampSlug, humanize } from "./slugs";
import { extractBodyEmbeds, type BodyEmbed } from "./embeds";
import { seriesKeyFor, withSeriesKey } from "./render-key";
export { renderKey } from "./render-key";

function coalesce<T>(): MemoOptions<T> {
    return {
        ttlMs: 1_000,
        onError: (err, stale) => {
            if (stale !== undefined) return stale;
            throw err;
        },
    };
}

const cachedCollections = () =>
    memo<Collection[]>("collections", getCollections, coalesce());
const cachedEntries = (drafts = false) =>
    memo<Entry[]>(
        `entries:_all:${drafts ? "all" : "pub"}`,
        () => getEntries(undefined, { drafts }),
        coalesce(),
    );
const cachedPosts = () => memo<Post[]>("posts", getPosts, coalesce());

export { getAllSeries, getSeries, getBlobMeta, blobURL };

export async function seriesIndex(): Promise<Map<string, string>> {
    return new Map((await getAllSeries()).map((s: Series) => [s.slug, s.cid]));
}

/**
 * The series fingerprint com keys renders on: `slug:cid` for every embedded
 * series, "" when the body embeds none. A series edit changes this but not
 * the embedding record's cid.
 */
export async function seriesKeyOf(body: string): Promise<string> {
    return body.includes("series://") ? seriesKeyFor(body, await seriesIndex()) : "";
}

export async function bodyRenderKey(record: { cid: string; body: string }): Promise<string> {
    return withSeriesKey(record.cid, await seriesKeyOf(record.body));
}

export interface ResolvedMedia {
    cid: string;
    alt: string;
    meta: BlobMeta | null;
}

export async function expandEmbed(embed: BodyEmbed): Promise<BodyEmbed[]> {
    if (embed.scheme === "blob") return [embed];
    return extractBodyEmbeds((await getSeries(embed.id))?.body ?? "").filter((inner) => inner.scheme === "blob");
}

export async function resolveEmbedMedia(embed: BodyEmbed): Promise<ResolvedMedia[]> {
    const blobs = await expandEmbed(embed);
    const metas = await Promise.all(blobs.map((b) => getBlobMeta(b.id)));
    return blobs.map((b, i) => ({ cid: b.id, alt: b.alt, meta: metas[i] }));
}

export interface PublicationData {
    [key: string]: unknown;
    slug: string;
    name: string;
    description?: string;
    createdAt?: string;
    entryCount?: number;
}

export interface DocumentData {
    [key: string]: unknown;
    collection: string;
    rkey: string;
    cid: string;
    title: string;
    description: string;
    published: boolean;
    href: string;
    publishedAt: string;
    updatedAt: string;
    publication: PublicationData;
    tags: string[];
    body: string;
    seriesKey?: string;
}

export interface FeedEntryData {
    [key: string]: unknown;
    rkey: string;
    cid: string;
    body: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export function entriesOf<T>(
    rows: ReadonlyArray<{ data: unknown }> | undefined,
): T[] {
    return (rows ?? []).map((e) => e.data as T);
}

export function publicationFrom(collection: Collection): PublicationData {
    return {
        slug: collection.slug,
        name: collection.name || humanize(collection.slug),
        description: collection.description,
        createdAt: collection.createdAt,
        entryCount: collection.entryCount,
    };
}

async function publicationsBySlug(): Promise<Map<string, PublicationData>> {
    const list = await cachedCollections();
    return new Map(list.map((c) => [c.slug, publicationFrom(c)]));
}

export async function livePublications(): Promise<PublicationData[]> {
    return (await cachedCollections()).map(publicationFrom);
}

export async function publicationSlugSet(): Promise<Set<string>> {
    const list = await cachedCollections();
    return new Set(list.map((c) => c.slug));
}

export function entryToDocument(
    entry: Entry,
    pub: PublicationData,
): DocumentData {
    return {
        collection: entry.collection,
        rkey: entry.slug,
        cid: entry.cid,
        title: entry.title,
        description: entry.excerpt?.trim() ?? "",
        published: entry.published,
        href: `/${entry.collection}/${entry.slug}`,
        publishedAt: entry.publishedAt || entry.createdAt,
        updatedAt: entry.updatedAt,
        publication: pub,
        tags: entry.tags ?? [],
        body: entry.body,
    };
}

export { isStampedSlug, unstampSlug };

export async function stampedHref(
    collection: string,
    slug: string,
): Promise<string | null> {
    if (isStampedSlug(slug)) return null;
    const docs = await loadAllDocuments();
    const match = docs.find(
        (d) =>
            d.collection === collection &&
            isStampedSlug(d.rkey) &&
            unstampSlug(d.rkey) === slug,
    );
    return match?.href ?? null;
}

export async function loadAllDocuments(
    drafts = false,
): Promise<DocumentData[]> {
    const [entries, pubs] = await Promise.all([
        cachedEntries(drafts),
        publicationsBySlug(),
    ]);
    const docs = entries
        .map((e) => {
            const pub = pubs.get(e.collection);
            if (!pub) return null;
            return entryToDocument(e, pub);
        })
        .filter((d): d is DocumentData => d !== null);
    docs.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return docs;
}

export function postToFeedEntry(post: Post): FeedEntryData {
    return {
        rkey: post.slug,
        cid: post.cid,
        body: post.body,
        tags: post.tags ?? [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
}

export async function loadAllFeedEntries(): Promise<FeedEntryData[]> {
    const posts = await cachedPosts();
    const items = posts.map(postToFeedEntry);
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
}

