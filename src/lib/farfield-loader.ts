// Astro Live Content Collection loaders backed by Farfield.
//
// Three layers of caching cover request-shape traffic:
//   1. `caches.default` on the raw HTTP fetches (in farfield.ts)
//   2. The per-isolate in-memory TTL map below, with in-flight
//      coalescing so a stampede of cold renders collapses to one
//      upstream call per endpoint
//   3. `Cache-Control: s-maxage=60, swr=300` on the rendered HTML
//      response (applied by pages via lib/cache.ts)

import type { LiveLoader } from "astro/loaders";
import {
    blobURL,
    extractBodyEmbeds,
    getCollections,
    getEntries,
    getEntry,
    getPosts,
    getSeries,
    getBlobMeta,
    type BlobMeta,
    type Collection,
    type Entry,
    type Post,
} from "./farfield";

// ---------- per-isolate TTL cache + in-flight coalescing -------------------
//
// 60s TTL matches the soft TTL in `farfield.ts`'s edge cache layer.
// Together: a single isolate handles bursts entirely in-memory; cross-
// isolate hits within the window come from `caches.default`; past the
// window, an `If-None-Match` revalidation against the cached CID
// returns 304 when content is unchanged (cheap) or 200 with a fresh
// payload when it isn't. Lists re-fetch their full body when the TTL
// elapses (no ETag), but the payloads are small JSON.
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

// Convenience wrappers — every upstream call funnels through `memo` so
// retries / errors don't multiply.
const cachedCollections = () =>
    memo<Collection[]>("collections", getCollections);
// `drafts` is part of the cache key so the preview (published + drafts)
// and normal (published-only) variants never share an entry. Drafts are
// only ever fetched in dev preview mode.
const cachedEntries = (collection?: string, drafts = false) =>
    memo<Entry[]>(
        `entries:${collection ?? "_all"}:${drafts ? "all" : "pub"}`,
        () => getEntries(collection, { drafts }),
    );
const cachedPosts = () => memo<Post[]>("posts", getPosts);

// Re-export the per-record fetchers (no shared-list cache — Farfield
// caches per-record responses upstream and `getBlobMeta`/`getSeries`
// are cheap, per-rkey calls).
export { getSeries, getBlobMeta, blobURL };

/**
 * Walk an entry/post body and return every image embed it references,
 * with each blob's `/meta` already resolved. Series embeds are
 * expanded — a `series://<slug>` becomes the blobs inside that series
 * body. Deduped (a cid that appears both inline and inside a series
 * only renders once). Suitable for building galleries on list cards
 * and detail pages.
 */
export interface ResolvedMedia {
    cid: string;
    alt: string;
    meta: BlobMeta | null;
}

export async function resolveBodyMedia(
    body: string,
): Promise<ResolvedMedia[]> {
    const embeds = extractBodyEmbeds(body);
    const expanded: { cid: string; alt: string }[] = [];
    for (const e of embeds) {
        if (e.scheme === "blob") {
            expanded.push({ cid: e.id, alt: e.alt });
        } else {
            const series = await getSeries(e.id);
            if (!series?.body) continue;
            for (const inner of extractBodyEmbeds(series.body)) {
                if (inner.scheme === "blob") {
                    expanded.push({ cid: inner.id, alt: inner.alt });
                }
            }
        }
    }
    const seen = new Set<string>();
    const unique = expanded.filter((m) => {
        if (seen.has(m.cid)) return false;
        seen.add(m.cid);
        return true;
    });
    const metas = await Promise.all(unique.map((m) => getBlobMeta(m.cid)));
    return unique.map((m, i) => ({ ...m, meta: metas[i] }));
}

// ---------- consumer-facing data shapes ------------------------------------
//
// Index signatures satisfy Astro's `Record<string, any>` constraint at
// the `defineLiveCollection` seam.

export interface PublicationData {
    [key: string]: unknown;
    slug: string;
    name: string;
    description?: string;
    /** ISO timestamp from Farfield. */
    createdAt?: string;
    /** Count of published entries — useful for headers ("X entries"). */
    entryCount?: number;
}

export interface DocumentData {
    [key: string]: unknown;
    /** Publication slug. */
    collection: string;
    /** Slug — last segment of the URL path. */
    rkey: string;
    /** CIDv1 fingerprint of the record's content. Stable until the
     *  content changes — handy for cache tags and change detection. */
    cid: string;
    title: string;
    /** Excerpt — explicit if Farfield carries one, else "". */
    description: string;
    /**
     * Whether Farfield has this entry published. Always `true` on
     * surfaces that filter drafts out (the default); `false` only
     * reaches a page in dev preview mode, where it drives the draft
     * badge.
     */
    published: boolean;
    /** Relative path on this site. */
    href: string;
    /** Created — the field the site sorts by. */
    publishedAt: string;
    updatedAt: string;
    publication: PublicationData;
    tags: string[];
    /** Raw markdown body — `blob://` and `series://` embeds intact. */
    body: string;
}

export interface FeedEntryData {
    [key: string]: unknown;
    /** Stable id from Farfield (`Post.id`). */
    rkey: string;
    /** CIDv1 fingerprint of the post's content. */
    cid: string;
    /** Markdown body — embeds resolved at render time. */
    body: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Unwrap `getLiveCollection`'s `entries` array — Astro types the inner
 * `data` field as `unknown` to satisfy the loader contract, but each
 * loader knows its own row shape. Pages call this with the matching
 * `*Data` type to get a clean `T[]` without repeating the cast.
 */
export function entriesOf<T>(
    rows: ReadonlyArray<{ data: unknown }> | undefined,
): T[] {
    return (rows ?? []).map((e) => e.data as T);
}

// ---------- helpers --------------------------------------------------------

/**
 * Title-Case a kebab-cased slug. Used as a fallback when a collection
 * record on Farfield doesn't carry a `name` field.
 */
function humanize(slug: string): string {
    return slug
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
}

function publicationFrom(collection: Collection): PublicationData {
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

function entryToDocument(
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
        publishedAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publication: pub,
        tags: entry.tags ?? [],
        body: entry.body,
    };
}

async function loadAllDocuments(drafts = false): Promise<DocumentData[]> {
    const [entries, pubs] = await Promise.all([
        cachedEntries(undefined, drafts),
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

// ---------- live loaders ---------------------------------------------------

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
        async loadEntry({ filter }) {
            try {
                const slug =
                    typeof filter?.id === "string" ? filter.id : undefined;
                if (!slug) return undefined;
                const map = await publicationsBySlug();
                const match = map.get(slug);
                if (!match) return undefined;
                return {
                    id: match.slug,
                    data: match,
                    cacheHint: {
                        tags: ["publications", `pub-${match.slug}`],
                    },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load publication", {
                        cause: error,
                    }),
                };
            }
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
                const fPub =
                    typeof filter?.publication === "string"
                        ? filter.publication
                        : undefined;
                const fTag =
                    typeof filter?.tag === "string" ? filter.tag : undefined;
                // Preview mode (dev only — see lib/preview.ts) keeps
                // unpublished drafts in the list. Every other surface
                // filters them out, since the authenticated content API
                // now returns drafts alongside published entries.
                const preview = filter?.preview === true;

                let docs: DocumentData[];
                if (fPub) {
                    // Single-publication lists hit Farfield's
                    // ?collection= query path — saves stitching the
                    // whole set when we only need one.
                    const [entries, pubs] = await Promise.all([
                        cachedEntries(fPub, preview),
                        publicationsBySlug(),
                    ]);
                    const pub = pubs.get(fPub);
                    if (!pub) return { entries: [] };
                    docs = entries.map((e) => entryToDocument(e, pub));
                    docs.sort((a, b) =>
                        b.publishedAt.localeCompare(a.publishedAt),
                    );
                } else {
                    docs = await loadAllDocuments(preview);
                }
                // Belt-and-suspenders: preview fetches `?status=all`
                // (published + drafts) and keeps everything; every other
                // path fetches published-only, so this filter is a no-op
                // there but guarantees a draft can never slip through.
                if (!preview) docs = docs.filter((d) => d.published);
                if (fTag) docs = docs.filter((d) => d.tags.includes(fTag));

                const cacheTags = ["documents"];
                if (fPub) cacheTags.push(`pub-${fPub}`);
                if (fTag) cacheTags.push(`tag-${fTag}`);
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
        async loadEntry({ filter }) {
            try {
                const fPub =
                    typeof filter?.publication === "string"
                        ? filter.publication
                        : undefined;
                const fSlug =
                    typeof filter?.slug === "string" ? filter.slug : undefined;
                const fId =
                    typeof filter?.id === "string" ? filter.id : undefined;
                const preview = filter?.preview === true;

                // Direct slug → Farfield path is cheapest. Use it when
                // we have the slug; otherwise parse from the composite
                // id `${pub}/${slug}`.
                let slug: string | undefined;
                if (fSlug) {
                    slug = fSlug;
                } else if (fId) {
                    const idx = fId.indexOf("/");
                    slug = idx >= 0 ? fId.slice(idx + 1) : fId;
                }
                if (!slug) return undefined;

                const [entry, pubs] = await Promise.all([
                    getEntry(slug, { drafts: preview }),
                    publicationsBySlug(),
                ]);
                if (!entry) return undefined;
                // Drafts 404 like any missing record unless the request
                // is in preview mode (dev only). The authenticated API
                // returns drafts, so this guard is what keeps them off
                // the live site.
                if (!preview && entry.published === false) return undefined;
                // Optional safety check: when a `publication` filter is
                // provided, refuse to serve mismatched collections so
                // `/recipes/foo` can't surface a `posts/foo` entry.
                if (fPub && entry.collection !== fPub) return undefined;

                const pub = pubs.get(entry.collection);
                if (!pub) return undefined;
                const data = entryToDocument(entry, pub);
                return {
                    id: documentKey(data),
                    data,
                    cacheHint: {
                        lastModified: new Date(data.publishedAt),
                        tags: [
                            "documents",
                            `pub-${data.collection}`,
                            `doc-${documentKey(data)}`,
                            `cid-${data.cid}`,
                        ],
                    },
                };
            } catch (error) {
                return {
                    error: new Error("Failed to load Farfield document", {
                        cause: error,
                    }),
                };
            }
        },
    };
}

// ---------- feed loader ----------------------------------------------------

function postToFeedEntry(post: Post): FeedEntryData {
    return {
        rkey: post.slug,
        cid: post.cid,
        body: post.body,
        tags: post.tags ?? [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
}

async function loadAllFeedEntries(): Promise<FeedEntryData[]> {
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
