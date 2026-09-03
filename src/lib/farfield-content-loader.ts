
import type { Loader, LoaderContext } from "astro/loaders";
import {
    entryToDocument,
    publicationFrom,
    postToFeedEntry,
    renderKey,
} from "./farfield-loader";
import type { Collection, Entry, Post } from "./farfield";

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";

function env(name: string): string | undefined {
    return (
        (import.meta.env?.[name] as string | undefined) ??
        process.env[name]
    );
}

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
    const admin = env("CONTENT_API_KEY");
    if (import.meta.env.DEV && admin) {
        return { qs: "?status=all", key: admin };
    }
    return { qs: "", key: env("CONTENT_READ_KEY") };
}

let collectionsOnce: Promise<Collection[]> | null = null;
function getCollectionsOnce(): Promise<Collection[]> {
    collectionsOnce ??= fetchJSON<{ collections: Collection[] }>(
        `${CONTENT}/api/collections`,
        env("CONTENT_READ_KEY"),
        undefined,
    ).then((r) => r.data!.collections);
    return collectionsOnce;
}

export function farfieldDocsLoader(): Loader {
    return {
        name: "farfield-docs",
        async load({ store, meta, logger }: LoaderContext) {
            const { qs, key } = draftsQuery();
            const res = await fetchJSON<{ entries: Entry[] }>(
                `${CONTENT}/api/entries${qs}`,
                key,
                store.keys().length > 0
                    ? (meta.get("entries-etag") ?? undefined)
                    : undefined,
            );
            if (res.status === 304) {
                logger.info("entries unchanged (304) — store kept");
                return;
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
                store.set({
                    id: `${entry.collection}/${entry.slug}`,
                    data,
                    digest: renderKey(data),
                });
                n++;
            }
            if (res.etag) meta.set("entries-etag", res.etag);
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
                env("FEED_READ_KEY"),
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
