// Farfield — read-only content backend for the site. Three services:
//
//   content  https://content.farfield.systems  collections + entries + series
//   feed     https://feed.farfield.systems     short posts
//   blobs    https://blobs.farfield.systems    image bytes + per-blob meta
//
// Endpoints (final API):
//   GET /api/collections                         → Collection[]
//   GET /api/entries[?collection=<slug>]         → Entry[]
//   GET /api/entries/<slug>                      → Entry | 404
//   GET /api/series/<slug>                       → Series | 404
//   GET /api/posts                               → Post[]   (feed service)
//   GET /blobs/<cid>                             → bytes
//   GET /blobs/<cid>/meta                        → BlobMeta | 404
//
// Notes:
//   - The public API only returns published entries — no client-side
//     filter needed.
//   - Records are flat — `slug` is the rkey, no envelope.
//   - Series bodies are markdown that get spliced into a parent body.
//   - Feed posts no longer carry an explicit `link` field — links
//     live inside the markdown body.

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";
const BLOBS = "https://blobs.farfield.systems";

// ---------- record shapes ---------------------------------------------------

export interface Collection {
    slug: string;
    name: string;
    description?: string;
    createdAt: string;
    entryCount: number;
}

/**
 * Every Farfield record carries a `cid` — a CIDv1 hash over the
 * record's *content* (excluding key + timestamps). Same content → same
 * cid, forever. Two useful properties:
 *   1. **Versioning.** The cid changes iff the content changes — diff
 *      cids across builds to find what actually moved.
 *   2. **Cache validation.** Single-record GETs send `cid` as ETag,
 *      so `If-None-Match: "<cid>"` short-circuits to 304 when nothing
 *      has changed upstream.
 */
export interface Entry {
    collection: string;
    /** URL slug — also the rkey. */
    slug: string;
    /** CIDv1 over {collection, title, excerpt, body, tags, published}. */
    cid: string;
    title: string;
    excerpt?: string;
    /** Markdown body — run through `resolveBody()` before rendering. */
    body: string;
    tags: string[];
    /** Always `true` on the public API; kept for type compatibility. */
    published: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Series {
    /** URL slug — the rkey for `/api/series/{slug}`. Can contain hyphens. */
    slug: string;
    /** CIDv1 over {title, body}. */
    cid: string;
    title?: string;
    /** Markdown body — spliced in where `![](series://<slug>)` appears. */
    body: string;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    /** URL slug — also the rkey for `/api/posts/{slug}` lookups. */
    slug: string;
    /** CIDv1 over {body, tags}. */
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
}

// ---------- HTTP layer with edge cache + ETag revalidation -----------------
//
// Farfield's per-record endpoints send the record's CID as their ETag.
// We exploit this with conditional GETs:
//
//   1. First hit  — fetch + store the response (incl. its ETag) in
//                   `caches.default`.
//   2. Subsequent — if a cached copy exists, send `If-None-Match: "<cid>"`.
//                   - 304 → reuse cached body; refresh the soft-TTL marker
//                   - 200 → upstream content changed; replace cache
//
// `If-None-Match` is harmless on list endpoints (no ETag → server
// returns 200 + body), so the same code path covers both.
//
// Soft TTL is the "don't bother revalidating yet" window — within it
// we short-circuit. Past it, we revalidate. The 304 path is cheap
// (small header response) so a tight soft TTL stays affordable.

/**
 * How long to serve cached responses without contacting Farfield.
 *
 * Kept tight (60s) so that publishing content surfaces on the site
 * within roughly a minute. Records can validate cheaply past this
 * window via `If-None-Match: "<cid>"` → 304, so the tight TTL costs
 * almost nothing for record GETs. Lists (`/api/entries`, `/api/posts`,
 * `/api/collections`) don't expose ETags and pay a full re-fetch,
 * but the payloads are small JSON and the rendered HTML response
 * cache (set by pages via lib/cache.ts) absorbs the bulk of traffic.
 */
const SOFT_TTL_MS = 60_000;
/** Underlying max-age on stored Responses — sized to comfortably outlive
 *  SOFT_TTL_MS so we keep the bytes around for revalidation. */
const HARD_TTL_SECONDS = 24 * 60 * 60; // 24 h
const SWR_SECONDS = 60 * 60; // 1 h

function getEdgeCache(): Cache | undefined {
    const g = globalThis as { caches?: { default?: Cache } };
    return g.caches?.default;
}

/**
 * Outbound fetch with a single retry. The `User-Agent` header is
 * required: workerd will otherwise short-circuit the request inside
 * Cloudflare's network (Farfield is Cloudflare-fronted) and the
 * unbound destination returns `internal error; reference = …`.
 */
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
        return await fetch(input, opts);
    } catch (err) {
        await new Promise((r) => setTimeout(r, 80 + Math.random() * 80));
        try {
            return await fetch(input, opts);
        } catch (err2) {
            throw err2 instanceof Error ? err2 : new Error(String(err2));
        }
    }
}

/** Read the timestamp we stored on cache writes — 0 if missing/invalid. */
function getCachedAt(res: Response): number {
    const v = res.headers.get("x-cached-at");
    return v ? Number.parseInt(v, 10) || 0 : 0;
}

/** Wrap a Response with our cache metadata + Cache-Control. */
function stamp(res: Response, body: ArrayBuffer, now: number): Response {
    const out = new Response(body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
    });
    out.headers.set("x-cached-at", String(now));
    out.headers.set(
        "Cache-Control",
        `public, max-age=${HARD_TTL_SECONDS}, s-maxage=${HARD_TTL_SECONDS}, stale-while-revalidate=${SWR_SECONDS}`,
    );
    return out;
}

async function cachedFetch(url: string): Promise<Response> {
    const cache = getEdgeCache();
    const cached = cache
        ? await cache.match(url).catch(() => undefined)
        : undefined;
    const now = Date.now();

    // Within the soft TTL — cached copy is fresh enough, skip the
    // upstream round-trip entirely.
    if (cached && now - getCachedAt(cached) < SOFT_TTL_MS) {
        return cached;
    }

    // Past the soft TTL (or no cache hit) — fetch upstream, sending
    // the cached ETag if we have one so Farfield can return 304.
    const conditional: RequestInit = {};
    const cachedETag = cached?.headers.get("etag");
    if (cachedETag) {
        conditional.headers = { "If-None-Match": cachedETag };
    }
    const res = await fetchWithRetry(url, conditional);

    // 304 Not Modified — content unchanged; refresh the soft TTL on
    // the cached body and serve it.
    if (res.status === 304 && cached) {
        const body = await cached.clone().arrayBuffer();
        const refreshed = stamp(cached, body, now);
        if (cache) {
            try {
                await cache.put(url, refreshed.clone());
            } catch {
                /* ignore */
            }
        }
        return refreshed;
    }

    if (res.ok && cache) {
        const body = await res.clone().arrayBuffer();
        const cacheable = stamp(res, body, now);
        try {
            await cache.put(url, cacheable);
        } catch {
            /* ignore — fetch result still flows through */
        }
    }
    return res;
}

async function getJSON<T>(url: string): Promise<T> {
    const res = await cachedFetch(url);
    if (!res.ok) {
        throw new Error(`Farfield ${url} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

async function getJSONOrNull<T>(url: string): Promise<T | null> {
    const res = await cachedFetch(url);
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`Farfield ${url} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

// ---------- content API ----------------------------------------------------

export async function getCollections(): Promise<Collection[]> {
    const data = await getJSON<{ collections: Collection[] }>(
        `${CONTENT}/api/collections`,
    );
    return data.collections;
}

export async function getEntries(collection?: string): Promise<Entry[]> {
    const url = collection
        ? `${CONTENT}/api/entries?collection=${encodeURIComponent(collection)}`
        : `${CONTENT}/api/entries`;
    const data = await getJSON<{ entries: Entry[] }>(url);
    return data.entries;
}

export function getEntry(slug: string): Promise<Entry | null> {
    return getJSONOrNull<Entry>(
        `${CONTENT}/api/entries/${encodeURIComponent(slug)}`,
    );
}

export function getSeries(slug: string): Promise<Series | null> {
    return getJSONOrNull<Series>(
        `${CONTENT}/api/series/${encodeURIComponent(slug)}`,
    );
}

// ---------- feed API -------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
    const data = await getJSON<{ posts: Post[] }>(`${FEED}/api/posts`);
    return data.posts;
}

// ---------- blob helpers ---------------------------------------------------

export function blobURL(cid: string): string {
    return `${BLOBS}/blobs/${cid}`;
}

export function getBlobMeta(cid: string): Promise<BlobMeta | null> {
    return getJSONOrNull<BlobMeta>(`${BLOBS}/blobs/${cid}/meta`);
}

// ---------- wsrv image helpers ---------------------------------------------

/**
 * wsrv.nl proxied URL — fetches from `blobs.farfield.systems`,
 * resizes/converts, then edge-caches.
 */
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

/** A `srcset` string of `{wsrvUrl} {w}w` pairs. */
export function wsrvSrcSet(
    src: string,
    widths: readonly number[],
    opts: { quality?: number; format?: "webp" | "avif" | "jpg" } = {},
): string {
    return widths.map((w) => `${wsrvUrl(src, w, opts)} ${w}w`).join(", ");
}

// ---------- body resolution helpers ----------------------------------------

/**
 * Async-aware `String.prototype.replace`. Used by `resolveBody`.
 */
async function replaceAsync(
    s: string,
    re: RegExp,
    fn: (match: string, ...groups: string[]) => Promise<string>,
): Promise<string> {
    const jobs: Promise<string>[] = [];
    s.replace(re, (m, ...g) => {
        jobs.push(fn(m, ...g));
        return m;
    });
    const done = await Promise.all(jobs);
    return s.replace(re, () => done.shift()!);
}

// Series slugs may contain hyphens (e.g. `vsco-california`); blob CIDs
// are base32 (a–z + digits) and never carry one. The unified embed
// regex is permissive enough to cover both — accidental hyphens in
// a blob URI would be malformed input upstream regardless.
const SERIES_EMBED_RE = /!\[[^\]]*\]\(series:\/\/([a-z0-9-]+)\)/g;
const BLOB_REWRITE_RE = /blob:\/\/([a-z0-9]+)/g;

/**
 * Run an entry/post body through Farfield's two custom URI schemes:
 *
 *   ![](series://<slug>)  → spliced with the series' own markdown body
 *   blob://<cid>          → rewritten to the blobs URL
 *
 * One level of series expansion. If a series body itself references
 * another series, the inner reference is left untouched — extend with
 * a recursive loop if that case ever appears in production.
 */
export async function resolveBody(markdown: string): Promise<string> {
    const spliced = await replaceAsync(
        markdown,
        SERIES_EMBED_RE,
        async (_m, slug: string) => {
            const s = await getSeries(slug);
            return s?.body ?? "";
        },
    );
    return spliced.replace(BLOB_REWRITE_RE, (_m, cid: string) => blobURL(cid));
}

/**
 * Extract just the embed scheme + id pairs from a body — without
 * fetching or rewriting anything. Pages call this when they want to
 * render `blob://` and `series://` as `<figure>` / `<div class="series-grid">`
 * blocks (with proper srcset + width/height) instead of leaving them
 * as raw img tags emitted by marked.
 */
export interface BodyEmbed {
    alt: string;
    scheme: "blob" | "series";
    id: string;
}

/**
 * Strip-style regex (no captures around alt) that matches both blob://
 * and series:// embeds. Suitable for `.replace(..., "")` strip passes
 * and for `String.prototype.matchAll` extraction. Kept identical in
 * shape to FULL_EMBED_RE so consumers don't have to re-engineer the
 * slug character class. Exported so pages share one source of truth.
 */
export const EMBED_PATTERN_SOURCE =
    "!\\[[^\\]]*\\]\\((?:blob|series)://[a-z0-9-]+\\)";

const FULL_EMBED_RE =
    /!\[([^\]]*)\]\((blob|series):\/\/([a-z0-9-]+)\)/g;

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
