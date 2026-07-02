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
//   - `content.farfield.systems` and `feed.farfield.systems` gate reads
//     behind bearer tokens (`CONTENT_READ_KEY` / `FEED_READ_KEY`);
//     `blobs` stays public. The content admin key (`CONTENT_API_KEY`)
//     also unlocks unpublished drafts, so that API can return
//     `published: false` records — the loader filters those back out
//     unless a request opts into preview mode.
//   - Records are flat — `slug` is the rkey, no envelope.
//   - Series bodies are markdown that get spliced into a parent body.
//   - Feed posts no longer carry an explicit `link` field — links
//     live inside the markdown body.

import { getSecret } from "astro:env/server";

const CONTENT = "https://content.farfield.systems";
const FEED = "https://feed.farfield.systems";
const BLOBS = "https://blobs.farfield.systems";

/**
 * Bearer auth per Farfield service. `content` and `feed` are gated;
 * `blobs` is public (no header). Secrets are read lazily per-request
 * rather than at module scope: on Cloudflare the binding is only
 * populated inside request scope, so a top-level read would see
 * `undefined`. In `astro dev` they resolve from `.env`.
 *
 * Keys:
 *   - `CONTENT_READ_KEY` — published content. All normal traffic.
 *   - `CONTENT_API_KEY`  — admin key; the only one the content API
 *     returns drafts to (`?status=all`). Used exclusively by dev
 *     preview mode (and only on GET reads — never to mutate), so it
 *     never ships to production. Falls back to the read key if unset.
 *   - `FEED_READ_KEY`    — read token for the feed service.
 *
 * A missing key yields no header → upstream 401, which the loaders
 * surface as an empty collection (the pre-token broken state).
 */
/**
 * Read a secret robustly across environments. `astro:env`'s `getSecret`
 * resolves in `wrangler dev` but has been observed returning `undefined`
 * (or throwing) in the *deployed* Cloudflare Worker, where it reads the
 * `cloudflare:workers` env. So we fall back to `process.env`, which the
 * Worker populates from its bindings when the
 * `nodejs_compat_populate_process_env` flag is set (see wrangler.toml).
 */
export function readSecret(key: string): string | undefined {
    try {
        const v = getSecret(key);
        if (typeof v === "string" && v) return v;
    } catch {
        // getSecret can throw if the runtime env context is unavailable.
    }
    const fromProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
        .process?.env?.[key];
    return typeof fromProcess === "string" && fromProcess ? fromProcess : undefined;
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
        return {}; // blobs — public
    }
    return key ? { Authorization: `Bearer ${key}` } : {};
}

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
    /** Markdown body — `blob://` / `series://` embeds are resolved at
     *  render time (see lib/doc-render.ts). */
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

async function cachedFetch(url: string, drafts = false): Promise<Response> {
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
    // the cached ETag if we have one so Farfield can return 304. The
    // content service also needs its bearer token on every request.
    const headers: Record<string, string> = authHeaders(url, drafts);
    const cachedETag = cached?.headers.get("etag");
    if (cachedETag) {
        headers["If-None-Match"] = cachedETag;
    }
    const res = await fetchWithRetry(url, { headers });

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

async function getJSON<T>(url: string, drafts = false): Promise<T> {
    const res = await cachedFetch(url, drafts);
    if (!res.ok) {
        throw new Error(`Farfield ${url} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

async function getJSONOrNull<T>(url: string, drafts = false): Promise<T | null> {
    const res = await cachedFetch(url, drafts);
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

/**
 * List entries. `opts.drafts` opts into preview mode: it adds
 * `?status=all` (the API default is published-only) and authenticates
 * with the write key — the only key the API returns drafts to. Used
 * solely by dev preview; normal callers omit it and stay on the read
 * key + published-only.
 */
export async function getEntries(
    collection?: string,
    opts: { drafts?: boolean } = {},
): Promise<Entry[]> {
    const params = new URLSearchParams();
    if (collection) params.set("collection", collection);
    // `status=all` → published + drafts. Without it the endpoint
    // returns published-only regardless of which key is sent.
    if (opts.drafts) params.set("status", "all");
    const qs = params.toString();
    const url = `${CONTENT}/api/entries${qs ? `?${qs}` : ""}`;
    const data = await getJSON<{ entries: Entry[] }>(url, opts.drafts);
    return data.entries;
}

export function getEntry(
    slug: string,
    opts: { drafts?: boolean } = {},
): Promise<Entry | null> {
    return getJSONOrNull<Entry>(
        `${CONTENT}/api/entries/${encodeURIComponent(slug)}`,
        opts.drafts,
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

// ---------- body embed helpers ----------------------------------------------

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
 * Strip-style regex source (no captures around alt) that matches both
 * blob:// and series:// embeds. Series slugs may contain hyphens (e.g.
 * `vsco-california`); blob CIDs are base32 (a–z + digits) and never
 * carry one — the unified class covers both. Kept identical in shape
 * to FULL_EMBED_RE so consumers don't have to re-engineer the slug
 * character class. Consumed by lib/markdown-text.ts, the one source of
 * truth for strip/plain-text passes.
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
