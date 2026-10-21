import { getContentCache, runtimeEnv } from "./runtime-env";
import { pLimit } from "./p-limit";
import { Lru } from "./lru";
import { afterResponse, perRequest } from "./request-scope";
import { nextAttemptMs, retryDelayMs } from "./retry";

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";
const BLOBS = "https://blobs.farfield.systems";

export function readSecret(key: string): string | undefined {
    const fromEnv = runtimeEnv()?.[key];
    if (typeof fromEnv === "string" && fromEnv) return fromEnv;
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
    } else if (url.startsWith(BLOBS)) {
        key = readSecret("BLOBS_READ_KEY");
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
    publishedAt?: string;
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

const HARD_TTL_SECONDS = 24 * 60 * 60;
const SWR_SECONDS = 60 * 60;
/** How long a copy checked upstream is trusted without checking again. */
const FRESH_MS = 30_000;

const IMMUTABLE_URL_RE =
    /^https:\/\/blobs\.farfield\.systems\/blobs\/[a-z0-9]+\/meta$/;
const IMMUTABLE_TTL_SECONDS = 365 * 24 * 60 * 60;
const NEGATIVE_TTL_SECONDS = 5 * 60;
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
const upstreamLimit = <T>(fn: () => Promise<T>): Promise<T> =>
    perRequest("upstream-limit", () => pLimit(MAX_CONCURRENT_UPSTREAM_FETCHES))(fn);

const RETRYABLE_STATUS = new Set([409, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MAX_FETCH_RETRIES = 3;
const MAX_RETRY_WAIT_MS = 2_000;
/** Per attempt; a timeout fails the attempt like a network error does. */
const UPSTREAM_TIMEOUT_MS = 5_000;
/** Every attempt and wait together: the most an outage adds to a page with nothing stale to show. */
const UPSTREAM_BUDGET_MS = 8_000;

/**
 * `retries: false` when the caller holds a stale copy: one attempt, and on failure the
 * caller serves that copy at once instead of holding the page through an outage.
 */
async function fetchWithRetry(
    input: string,
    init: RequestInit,
    retries = true,
): Promise<Response> {
    const headers = {
        Accept: "application/json",
        "User-Agent": "iammatthias.com/1.0 (+https://iammatthias.com)",
        ...(init.headers as Record<string, string> | undefined),
    };
    const opts: RequestInit = { ...init, headers };
    const start = Date.now();
    let timeout = Math.min(UPSTREAM_TIMEOUT_MS, UPSTREAM_BUDGET_MS);
    for (let attempt = 0; ; attempt++) {
        // the next attempt's timeout after `delay`, or null when no retry is left or fits
        const next = (delay: number) =>
            retries && attempt < MAX_FETCH_RETRIES
                ? nextAttemptMs(Date.now() - start, delay, UPSTREAM_BUDGET_MS, UPSTREAM_TIMEOUT_MS)
                : null;
        let res: Response;
        try {
            res = await fetch(input, { ...opts, signal: AbortSignal.timeout(timeout) });
        } catch (err) {
            const delay = retryDelayMs(attempt, null, MAX_RETRY_WAIT_MS);
            const nextTimeout = next(delay);
            if (nextTimeout === null) throw err instanceof Error ? err : new Error(String(err));
            await sleep(delay);
            timeout = nextTimeout;
            continue;
        }
        if (!RETRYABLE_STATUS.has(res.status)) return res;
        const delay = retryDelayMs(attempt, res.headers.get("retry-after"), MAX_RETRY_WAIT_MS);
        const nextTimeout = next(delay);
        if (nextTimeout === null) return res;
        try {
            await res.body?.cancel();
        } catch {}
        await sleep(delay);
        timeout = nextTimeout;
    }
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

    if (isImmutable) {
        const fromKV = await kvGetImmutable(url);
        if (fromKV) {
            if (cache && fromKV.status === 200) {
                const copy = fromKV.clone();
                await afterResponse(() => cache.put(url, copy));
            }
            return fromKV;
        }
    }

    // a copy this young is served as is: bursts of renders share one upstream check
    if (
        cached &&
        cached.ok &&
        !drafts &&
        now - Number(cached.headers.get("x-cached-at")) < FRESH_MS
    ) {
        return cached;
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
    const lastGood = () =>
        cached && cachedBody !== undefined
            ? withCacheMetadata(cached, cachedBody, now)
            : undefined;
    let res: Response;
    try {
        res = await upstreamLimit(() =>
            fetchWithRetry(url, { headers }, !(cached && cachedBody !== undefined)),
        );
    } catch (err) {
        const fallback = lastGood();
        if (fallback) return fallback;
        throw err;
    }
    // whatever fetchWithRetry would have retried: with a stale copy it gave up after one try
    if (RETRYABLE_STATUS.has(res.status) || res.status >= 500) {
        const fallback = lastGood();
        if (fallback) {
            await discardBody(res);
            return fallback;
        }
    }

    if (res.status === 304 && cached && cachedBody !== undefined) {
        const refreshed = withCacheMetadata(cached, cachedBody, now);
        if (cache) {
            const copy = refreshed.clone();
            await afterResponse(() => cache.put(url, copy));
        }
        return refreshed;
    }

    if (res.ok) {
        let body: ArrayBuffer;
        try {
            // the attempt's timeout covers the body too
            body = await res.clone().arrayBuffer();
        } catch (err) {
            await discardBody(res);
            const fallback = lastGood();
            if (fallback) return fallback;
            throw err;
        }
        if (cache) {
            const cacheable = withCacheMetadata(
                res,
                body,
                now,
                isImmutable ? IMMUTABLE_TTL_SECONDS : HARD_TTL_SECONDS,
            );
            await afterResponse(() => cache.put(url, cacheable));
        }
        if (isImmutable) {
            const text = new TextDecoder().decode(body);
            await afterResponse(() => kvPutImmutable(url, text, 200));
        }
        return new Response(body, res);
    } else if (isImmutable && res.status === 404) {
        await afterResponse(() => kvPutImmutable(url, "", 404));
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

export async function getAllSeries(): Promise<Series[]> {
    const data = await getJSON<{ series: Series[] }>(`${CONTENT}/api/series`);
    return data.series;
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

/**
 * A blob's meta never changes (the cid is its hash): resolved copies are kept across
 * requests. Only found ones: a miss may be a blob not uploaded yet.
 */
const blobMetaByCid = new Lru<string, BlobMeta>(500);

export async function getBlobMeta(cid: string): Promise<BlobMeta | null> {
    const known = blobMetaByCid.get(cid);
    if (known) return known;
    try {
        const meta = await getJSONOrNull<BlobMeta>(`${BLOBS}/blobs/${cid}/meta`);
        if (meta) blobMetaByCid.set(cid, meta);
        return meta;
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
