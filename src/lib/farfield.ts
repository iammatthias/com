import { getSecret } from "astro:env/server";
import pLimit from "p-limit";
import { getContentCache } from "./runtime-env";

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";
const BLOBS = "https://blobs.farfield.systems";

export function readSecret(key: string): string | undefined {
    try {
        const fromAstroEnv = getSecret(key);
        if (typeof fromAstroEnv === "string" && fromAstroEnv) {
            return fromAstroEnv;
        }
    } catch {}
    const fromProcess = (
        globalThis as {
            process?: { env?: Record<string, string | undefined> };
        }
    ).process?.env?.[key];
    return typeof fromProcess === "string" && fromProcess
        ? fromProcess
        : undefined;
}

function authHeaders(url: string, drafts = false): Record<string, string> {
    let key: string | undefined;
    if (url.startsWith(CONTENT)) {
        key = drafts
            ? readSecret("CONTENT_API_KEY") ?? readSecret("CONTENT_READ_KEY")
            : readSecret("CONTENT_READ_KEY");
    } else if (url.startsWith(FEED)) {
        key = readSecret("FEED_READ_KEY");
    } else {
        return {};
    }
    return key ? { Authorization: `Bearer ${key}` } : {};
}

export interface Collection {
    slug: string;
    name: string;
    description?: string;
    createdAt: string;
    entryCount: number;
}

export interface Entry {
    collection: string;
    slug: string;
    cid: string;
    title: string;
    excerpt?: string;
    body: string;
    tags: string[];
    published: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Series {
    slug: string;
    cid: string;
    title?: string;
    body: string;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    slug: string;
    cid: string;
    body: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface BlobMeta {
    cid: string;
    size: number;
    mime: string;
    width?: number;
    height?: number;
    blurhash?: string;
    dominantColor?: string;
    thumbCid?: string;
    createdAt?: string;
}

const SOFT_TTL_MS = 60_000;
const HARD_TTL_SECONDS = 24 * 60 * 60;
const SWR_SECONDS = 60 * 60;

const IMMUTABLE_URL_RE =
    /^https:\/\/blobs\.farfield\.systems\/blobs\/[a-z0-9]+\/meta$/;
const IMMUTABLE_TTL_SECONDS = 365 * 24 * 60 * 60;
const NEGATIVE_TTL_SECONDS = 24 * 60 * 60;
const KV_PREFIX = "imm:v1:";

async function kvGetImmutable(url: string): Promise<Response | undefined> {
    const kv = await getContentCache();
    if (!kv) return undefined;
    try {
        const { value, metadata } = await kv.getWithMetadata(
            KV_PREFIX + url,
            "text",
        );
        if (value === null) return undefined;
        const status = (metadata as { s?: number } | null)?.s ?? 200;
        if (status === 404) return new Response(null, { status: 404 });
        return new Response(value, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "x-cached-at": String(Date.now()),
                "Cache-Control": `public, max-age=${IMMUTABLE_TTL_SECONDS}, immutable`,
            },
        });
    } catch {
        return undefined;
    }
}

async function kvPutImmutable(
    url: string,
    body: string,
    status: 200 | 404,
): Promise<void> {
    const kv = await getContentCache();
    if (!kv) return;
    try {
        await kv.put(KV_PREFIX + url, body, {
            metadata: { s: status },
            ...(status === 404 ? { expirationTtl: NEGATIVE_TTL_SECONDS } : {}),
        });
    } catch {}
}

function getEdgeCache(): Cache | undefined {
    const g = globalThis as { caches?: { default?: Cache } };
    return g.caches?.default;
}

const MAX_CONCURRENT_UPSTREAM_FETCHES = 8;
const upstreamLimit = pLimit(MAX_CONCURRENT_UPSTREAM_FETCHES);

const RETRYABLE_STATUS = new Set([409, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(
    input: string,
    init: RequestInit,
): Promise<Response> {
    const headers = {
        Accept: "application/json",
        "User-Agent": "iammatthias.com/1.0 (+https://iammatthias.com)",
        ...(init.headers as Record<string, string> | undefined),
    };
    const opts: RequestInit = { ...init, headers };
    try {
        const res = await fetch(input, opts);
        if (!RETRYABLE_STATUS.has(res.status)) return res;
        try {
            await res.body?.cancel();
        } catch {}
        await sleep(150 + Math.random() * 150);
        return await fetch(input, opts);
    } catch {
        await sleep(80 + Math.random() * 80);
        try {
            return await fetch(input, opts);
        } catch (err2) {
            throw err2 instanceof Error ? err2 : new Error(String(err2));
        }
    }
}

function getCachedAt(res: Response): number {
    const v = res.headers.get("x-cached-at");
    return v ? Number.parseInt(v, 10) || 0 : 0;
}

function withCacheMetadata(
    res: Response,
    body: ArrayBuffer,
    now: number,
    ttlSeconds = HARD_TTL_SECONDS,
): Response {
    const out = new Response(body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
    });
    out.headers.set("x-cached-at", String(now));
    out.headers.set(
        "Cache-Control",
        `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=${SWR_SECONDS}`,
    );
    return out;
}

async function cachedFetch(url: string, drafts = false): Promise<Response> {
    const isImmutable = IMMUTABLE_URL_RE.test(url);
    const cache = getEdgeCache();
    const cached = cache
        ? await cache.match(url).catch(() => undefined)
        : undefined;
    const now = Date.now();

    if (cached && isImmutable) {
        return cached;
    }

    const withinSoftTtl = cached && now - getCachedAt(cached) < SOFT_TTL_MS;
    if (withinSoftTtl) {
        return cached;
    }

    if (isImmutable) {
        const fromKV = await kvGetImmutable(url);
        if (fromKV) {
            if (cache && fromKV.status === 200) {
                try {
                    await cache.put(url, fromKV.clone());
                } catch {}
            }
            return fromKV;
        }
    }

    const cachedETag = cached?.headers.get("etag");
    let cachedBody: ArrayBuffer | undefined;
    if (cached) {
        try {
            cachedBody = await cached.arrayBuffer();
        } catch {
            cachedBody = undefined;
        }
    }

    const headers: Record<string, string> = authHeaders(url, drafts);
    const canReuseBodyOn304 = cachedETag && cachedBody !== undefined;
    if (canReuseBodyOn304) {
        headers["If-None-Match"] = cachedETag;
    }
    const res = await upstreamLimit(() => fetchWithRetry(url, { headers }));

    if (res.status === 304 && cached && cachedBody !== undefined) {
        const refreshed = withCacheMetadata(cached, cachedBody, now);
        if (cache) {
            try {
                await cache.put(url, refreshed.clone());
            } catch {}
        }
        return refreshed;
    }

    if (res.ok) {
        const body = await res.clone().arrayBuffer();
        if (cache) {
            const cacheable = withCacheMetadata(
                res,
                body,
                now,
                isImmutable ? IMMUTABLE_TTL_SECONDS : HARD_TTL_SECONDS,
            );
            try {
                await cache.put(url, cacheable);
            } catch {}
        }
        if (isImmutable) {
            await kvPutImmutable(url, new TextDecoder().decode(body), 200);
        }
    } else if (isImmutable && res.status === 404) {
        await kvPutImmutable(url, "", 404);
    }
    return res;
}

async function discardBody(res: Response): Promise<void> {
    try {
        await res.body?.cancel();
    } catch {}
}

function upstreamError(url: string, res: Response): Error {
    const ray = res.headers.get("cf-ray");
    return new Error(
        `Farfield ${url} failed: ${res.status} ${res.statusText}` +
            (ray ? ` (cf-ray ${ray})` : ""),
    );
}

async function getJSON<T>(url: string, drafts = false): Promise<T> {
    const res = await cachedFetch(url, drafts);
    if (!res.ok) {
        const err = upstreamError(url, res);
        await discardBody(res);
        throw err;
    }
    return (await res.json()) as T;
}

async function getJSONOrNull<T>(
    url: string,
    drafts = false,
): Promise<T | null> {
    const res = await cachedFetch(url, drafts);
    if (res.status === 404) {
        await discardBody(res);
        return null;
    }
    if (!res.ok) {
        const err = upstreamError(url, res);
        await discardBody(res);
        throw err;
    }
    return (await res.json()) as T;
}

export async function getCollections(): Promise<Collection[]> {
    const data = await getJSON<{ collections: Collection[] }>(
        `${CONTENT}/api/collections`,
    );
    return data.collections;
}

export async function getEntries(
    collection?: string,
    opts: { drafts?: boolean } = {},
): Promise<Entry[]> {
    const params = new URLSearchParams();
    if (collection) params.set("collection", collection);
    if (opts.drafts) params.set("status", "all");
    const qs = params.toString();
    const url = `${CONTENT}/api/entries${qs ? `?${qs}` : ""}`;
    const data = await getJSON<{ entries: Entry[] }>(url, opts.drafts);
    return data.entries;
}

export function getSeries(slug: string): Promise<Series | null> {
    return getJSONOrNull<Series>(
        `${CONTENT}/api/series/${encodeURIComponent(slug)}`,
    );
}

export async function getPosts(): Promise<Post[]> {
    const data = await getJSON<{ posts: Post[] }>(`${FEED}/api/posts`);
    return data.posts;
}

export function blobURL(cid: string): string {
    return `${BLOBS}/blobs/${cid}`;
}

export async function getBlobMeta(cid: string): Promise<BlobMeta | null> {
    try {
        return await getJSONOrNull<BlobMeta>(`${BLOBS}/blobs/${cid}/meta`);
    } catch (err) {
        console.warn(`[farfield] blob meta ${cid} unavailable:`, err);
        return null;
    }
}

export function wsrvUrl(
    src: string,
    width: number,
    opts: { quality?: number; format?: "webp" | "avif" | "jpg" } = {},
): string {
    const params = new URLSearchParams({
        url: src,
        w: String(width),
        q: String(opts.quality ?? 80),
        output: opts.format ?? "webp",
    });
    return `https://wsrv.nl/?${params.toString()}`;
}

export function wsrvSrcSet(
    src: string,
    widths: readonly number[],
    opts: { quality?: number; format?: "webp" | "avif" | "jpg" } = {},
): string {
    return widths.map((w) => `${wsrvUrl(src, w, opts)} ${w}w`).join(", ");
}

export interface BodyEmbed {
    alt: string;
    scheme: "blob" | "series";
    id: string;
}

const FULL_EMBED_RE = /!\[([^\]]*)\]\((blob|series):\/\/([a-z0-9-]+)\)/g;

export const EMBED_PATTERN_SOURCE = FULL_EMBED_RE.source;

export const BLOB_ID_SOURCE = "blob:\\/\\/([a-z0-9-]+)";

export function fullEmbedRe(): RegExp {
    return new RegExp(FULL_EMBED_RE.source, "g");
}

export function extractBodyEmbeds(markdown: string): BodyEmbed[] {
    const out: BodyEmbed[] = [];
    for (const m of markdown.matchAll(FULL_EMBED_RE)) {
        out.push({
            alt: m[1],
            scheme: m[2] as "blob" | "series",
            id: m[3],
        });
    }
    return out;
}
