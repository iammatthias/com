
import type { LiveLoader } from "astro/loaders";
import {
    blobURL,
    extractBodyEmbeds,
    getCollections,
    getEntries,
    getPosts,
    getSeries,
    getBlobMeta,
    type BlobMeta,
    type Collection,
    type Entry,
    type Post,
} from "./farfield";

const TTL_MS = 60_000;

interface CacheEntry<T> {
    data: T;
    expires: number;
}

const ttlCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

async function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = ttlCache.get(key);
    if (hit && hit.expires > now) return hit.data as T;
    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;
    const promise = load()
        .then((data) => {
            ttlCache.set(key, { data, expires: now + TTL_MS });
            inFlight.delete(key);
            return data;
        })
        .catch((err) => {
            inFlight.delete(key);
            throw err;
        });
    inFlight.set(key, promise as Promise<unknown>);
    return promise;
}

const cachedCollections = () =>
    memo<Collection[]>("collections", getCollections);
const cachedEntries = (drafts = false) =>
    memo<Entry[]>(`entries:_all:${drafts ? "all" : "pub"}`, () =>
        getEntries(undefined, { drafts }),
    );
const cachedPosts = () => memo<Post[]>("posts", getPosts);

export { getSeries, getBlobMeta, blobURL };

export interface ResolvedMedia {
    cid: string;
    alt: string;
    meta: BlobMeta | null;
}

export async function resolveBodyMedia(
    body: string,
): Promise<ResolvedMedia[]> {
    const embeds = extractBodyEmbeds(body);
    const expanded = (
        await Promise.all(
            embeds.map(async (e): Promise<{ cid: string; alt: string }[]> => {
                if (e.scheme === "blob") return [{ cid: e.id, alt: e.alt }];
                const series = await getSeries(e.id);
                if (!series?.body) return [];
                return extractBodyEmbeds(series.body)
                    .filter((inner) => inner.scheme === "blob")
                    .map((inner) => ({ cid: inner.id, alt: inner.alt }));
            }),
        )
    ).flat();
    const seen = new Set<string>();
    const unique = expanded.filter((m) => {
        if (seen.has(m.cid)) return false;
        seen.add(m.cid);
        return true;
    });
    const metas = await Promise.all(unique.map((m) => getBlobMeta(m.cid)));
    return unique.map((m, i) => ({ ...m, meta: metas[i] }));
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

function humanize(slug: string): string {
    return slug
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
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

export function renderKey(
    doc: Pick<DocumentData, "cid" | "publishedAt" | "updatedAt">,
): string {
    return `${doc.cid}@${doc.publishedAt}@${doc.updatedAt}`;
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

function documentKey(doc: DocumentData): string {
    return `${doc.collection}/${doc.rkey}`;
}

export function publicationsLoader(): LiveLoader<
    PublicationData,
    Record<string, unknown>,
    Record<string, unknown>
> {
    return {
        name: "farfield-publications",
        async loadCollection() {
            try {
                const list = await cachedCollections();
                const pubs = list.map(publicationFrom);
                return {
                    entries: pubs.map((pub) => ({
                        id: pub.slug,
                        data: pub,
                        cacheHint: {
                            tags: ["publications", `pub-${pub.slug}`],
                        },
                    })),
                    cacheHint: { tags: ["publications"] },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load publications", {
                        cause: error,
                    }),
                };
            }
        },
        async loadEntry() {
            return undefined;
        },
    };
}

export function documentsLoader(): LiveLoader<
    DocumentData,
    Record<string, unknown>,
    Record<string, unknown>
> {
    return {
        name: "farfield-documents",
        async loadCollection({ filter }) {
            try {
                const preview = filter?.preview === true;

                let docs = await loadAllDocuments(preview);
                if (!preview) docs = docs.filter((d) => d.published);

                const cacheTags = ["documents"];
                const lastModified =
                    docs.length > 0
                        ? new Date(docs[0].publishedAt)
                        : new Date();

                return {
                    entries: docs.map((doc) => ({
                        id: documentKey(doc),
                        data: doc,
                        cacheHint: {
                            lastModified: new Date(doc.publishedAt),
                            tags: [
                                "documents",
                                `pub-${doc.collection}`,
                                `doc-${documentKey(doc)}`,
                                `cid-${doc.cid}`,
                            ],
                        },
                    })),
                    cacheHint: { lastModified, tags: cacheTags },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load Farfield documents", {
                        cause: error,
                    }),
                };
            }
        },
        async loadEntry() {
            return undefined;
        },
    };
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

export function feedEntriesLoader(): LiveLoader<
    FeedEntryData,
    Record<string, unknown>,
    Record<string, unknown>
> {
    return {
        name: "farfield-feed-entries",
        async loadCollection() {
            try {
                const all = await loadAllFeedEntries();
                const lastModified =
                    all.length > 0
                        ? new Date(all[0].createdAt)
                        : new Date();
                return {
                    entries: all.map((entry) => ({
                        id: entry.rkey,
                        data: entry,
                        cacheHint: {
                            lastModified: new Date(entry.createdAt),
                            tags: [
                                "feed-entries",
                                `feed-entry-${entry.rkey}`,
                                `cid-${entry.cid}`,
                            ],
                        },
                    })),
                    cacheHint: { lastModified, tags: ["feed-entries"] },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load feed entries", {
                        cause: error,
                    }),
                };
            }
        },
        async loadEntry({ filter }) {
            try {
                const id =
                    typeof filter?.id === "string" ? filter.id : undefined;
                if (!id) return undefined;
                const all = await loadAllFeedEntries();
                const match = all.find((e) => e.rkey === id);
                if (!match) return undefined;
                return {
                    id: match.rkey,
                    data: match,
                    cacheHint: {
                        lastModified: new Date(match.createdAt),
                        tags: [
                            "feed-entries",
                            `feed-entry-${match.rkey}`,
                            `cid-${match.cid}`,
                        ],
                    },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load feed entry", {
                        cause: error,
                    }),
                };
            }
        },
    };
}
