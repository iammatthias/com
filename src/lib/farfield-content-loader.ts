
import type { Loader, LoaderContext } from "astro/loaders";
import {
    entryToDocument,
    publicationFrom,
    postToFeedEntry,
    renderKey,
    seriesIndex,
    seriesKeyFor,
} from "./farfield-loader";
import { readSecret, type Collection, type Entry, type Post } from "./farfield";

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";
const DOCS_STORE_VERSION = "2";

async function fetchJSON<T>(
    url: string,
    key: string | undefined,
    etag: string | undefined,
): Promise<{ status: 200 | 304; data?: T; etag?: string }> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "iammatthias.com-build/1.0 (+https://iammatthias.com)",
    };
    if (key) headers.Authorization = `Bearer ${key}`;
    if (etag) headers["If-None-Match"] = etag;
    const res = await fetch(url, { headers });
    if (res.status === 304) return { status: 304 };
    if (!res.ok) {
        throw new Error(`Farfield ${url} failed: ${res.status} ${res.statusText}`);
    }
    return {
        status: 200,
        data: (await res.json()) as T,
        etag: res.headers.get("etag") ?? undefined,
    };
}

function draftsQuery(): { qs: string; key: string | undefined } {
    const admin = readSecret("CONTENT_API_KEY");
    if (import.meta.env.DEV && admin) {
        return { qs: "?status=all", key: admin };
    }
    return { qs: "", key: readSecret("CONTENT_READ_KEY") };
}

let collectionsOnce: Promise<Collection[]> | null = null;
function getCollectionsOnce(): Promise<Collection[]> {
    collectionsOnce ??= fetchJSON<{ collections: Collection[] }>(
        `${CONTENT}/api/collections`,
        readSecret("CONTENT_READ_KEY"),
        undefined,
    ).then((r) => r.data!.collections);
    return collectionsOnce;
}

export function farfieldDocsLoader(): Loader {
    return {
        name: "farfield-docs",
        async load({ store, meta, logger }: LoaderContext) {
            const { qs, key } = draftsQuery();
            const url = `${CONTENT}/api/entries${qs}`;
            let res = await fetchJSON<{ entries: Entry[] }>(
                url,
                key,
                store.keys().length > 0
                    ? (meta.get("entries-etag") ?? undefined)
                    : undefined,
            );
            const series = await seriesIndex();
            const seriesFingerprint = `v${DOCS_STORE_VERSION}|${[...series]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([slug, cid]) => `${slug}:${cid}`)
                .join(",")}`;
            const seriesMoved = meta.get("series-fingerprint") !== seriesFingerprint;

            if (res.status === 304 && !seriesMoved) {
                logger.info("entries unchanged (304) — store kept");
                return;
            }
            if (res.status === 304) {
                // A 304 carries no body, so refetch unconditionally to rebuild
                // digests against the series that moved.
                logger.info("entries unchanged (304) but a series moved — resyncing");
                res = await fetchJSON<{ entries: Entry[] }>(url, key, undefined);
            }
            const pubs = new Map(
                (await getCollectionsOnce()).map((c) => [
                    c.slug,
                    publicationFrom(c),
                ]),
            );
            store.clear();
            let n = 0;
            for (const entry of res.data!.entries) {
                const pub = pubs.get(entry.collection);
                if (!pub) continue;
                const data = entryToDocument(entry, pub);
                data.seriesKey = seriesKeyFor(data.body, series);
                store.set({
                    id: `${entry.collection}/${entry.slug}`,
                    data,
                    digest: renderKey(data),
                });
                n++;
            }
            if (res.etag) meta.set("entries-etag", res.etag);
            meta.set("series-fingerprint", seriesFingerprint);
            logger.info(`synced ${n} documents`);
        },
    };
}

export function farfieldPubsLoader(): Loader {
    return {
        name: "farfield-pubs",
        async load({ store, generateDigest }: LoaderContext) {
            const collections = await getCollectionsOnce();
            store.clear();
            for (const c of collections) {
                const data = publicationFrom(c);
                store.set({
                    id: c.slug,
                    data,
                    digest: generateDigest(data),
                });
            }
        },
    };
}

export function farfieldPostsLoader(): Loader {
    return {
        name: "farfield-posts",
        async load({ store, meta, logger }: LoaderContext) {
            const res = await fetchJSON<{ posts: Post[] }>(
                `${FEED}/api/posts`,
                readSecret("FEED_READ_KEY"),
                store.keys().length > 0
                    ? (meta.get("posts-etag") ?? undefined)
                    : undefined,
            );
            if (res.status === 304) {
                logger.info("posts unchanged (304) — store kept");
                return;
            }
            store.clear();
            for (const post of res.data!.posts) {
                store.set({
                    id: post.slug,
                    data: postToFeedEntry(post),
                    digest: post.cid,
                });
            }
            if (res.etag) meta.set("posts-etag", res.etag);
            logger.info(`synced ${res.data!.posts.length} posts`);
        },
    };
}
