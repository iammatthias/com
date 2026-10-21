import type { Ctx, Route } from "./context";
import { cardImageUrl } from "../lib/og-card";
import type { AppRoute, AppSsr } from "../app-api";
import { IMG_WIDTHS } from "../app-api";
import { appIndex, appTimeline, resolveAppRoute } from "../lib/app-route";
import {
    setDocumentPageCacheHeaders,
    setPageCacheHeaders,
    setResponseCacheHeaders,
    deepPageCacheOptions,
    EDGE_CACHE_HEADER,
    SHELL_TAG,
    seriesTags,
} from "../lib/cache";
import { notFoundPage, renderRoute } from "../lib/ssr";
import { headMeta } from "../lib/seo";
import { quietImages, ssrMainHtml } from "../lib/shell";
import { FEED_TAG, DOCUMENTS_TAG } from "../lib/revalidate";
import { jsonError } from "../lib/agent-http";
import { getBlobMeta, blobURL } from "../lib/farfield-loader";
import { readSecret, wsrvUrl } from "../lib/farfield";
import { ARCH_WIDTHS } from "../lib/images";
import { etagFor } from "../lib/http";

/** Data API for the GPUI app: plain same-origin GETs, no headers. See src/app-api.ts. */

/** With an ETag, so the app's revalidations are answered 304 (index.ts) */
export async function appJson(payload: unknown): Promise<Response> {
    const body = JSON.stringify(payload);
    return new Response(body, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            ETag: await etagFor(body),
        },
    });
}

/** Cache semantics of the HTML route the payload stands for, so one purge covers both. */
export function setRouteCacheHeaders(response: Response, route: AppRoute): void {
    switch (route.kind) {
        case "doc":
        case "list":
        case "tags":
        case "tag":
        case "content":
            setDocumentPageCacheHeaders(response);
            return;
        case "home":
            setResponseCacheHeaders(response, { tags: [FEED_TAG] }, { edge: true, extraTags: [DOCUMENTS_TAG] });
            return;
        case "feed":
            setResponseCacheHeaders(
                response,
                { tags: [FEED_TAG] },
                { ...deepPageCacheOptions(route.page), edge: true, extraTags: seriesTags(route.posts) },
            );
            return;
        case "post":
            setResponseCacheHeaders(response, { tags: [FEED_TAG] }, { edge: true, extraTags: seriesTags([route.post]) });
            return;
        case "page":
            if (route.slug === "menu") {
                setDocumentPageCacheHeaders(response);
            } else {
                setResponseCacheHeaders(response, undefined, { maxAge: 3600, swr: 86400, edge: true, extraTags: [SHELL_TAG] });
            }
            return;
        case "now":
            setResponseCacheHeaders(response, { tags: [FEED_TAG] }, { edge: true, extraTags: [DOCUMENTS_TAG] });
            return;
        case "resume":
        case "developers":
            setResponseCacheHeaders(response, undefined, { maxAge: 3600, swr: 86400, edge: true, extraTags: [SHELL_TAG] });
            return;
        case "redirect":
            setDocumentPageCacheHeaders(response);
            return;
        case "notfound":
            response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60");
            return;
    }
}

/**
 * The page preloads the index (and, on the home page, the first timeline page) alongside the app's own download;
 * a minute of browser freshness lets the app use those copies however long it took to start
 * (the edge's own policy, in Cloudflare-CDN-Cache-Control, is unchanged).
 */
function browserFresh(response: Response): void {
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
}

/** GET /api/app/timeline?page=N */
async function timelineHandler({ url }: Ctx): Promise<Response> {
    const response = await appJson(await appTimeline(Number(url.searchParams.get("page") ?? "1")));
    setDocumentPageCacheHeaders(response, [FEED_TAG]);
    browserFresh(response);
    return response;
}

async function indexHandler(): Promise<Response> {
    const response = await appJson(await appIndex());
    setDocumentPageCacheHeaders(response, [FEED_TAG]);
    browserFresh(response);
    return response;
}

function pathParam(url: URL, endpoint: string): URL | Response {
    const raw = url.searchParams.get("path");
    if (!raw || !raw.startsWith("/")) {
        return jsonError(
            400,
            "invalid_parameter",
            "The 'path' parameter is required and must be a site-relative path starting with '/'.",
            `Retry with e.g. /api/app/${endpoint}?path=%2Fposts.`,
        );
    }
    return new URL(raw, url.origin);
}

async function routeHandler({ url }: Ctx): Promise<Response> {
    const target = pathParam(url, "route");
    if (target instanceof Response) return target;
    const route = await resolveAppRoute(target.pathname, target.search);
    const response = await appJson(route);
    setRouteCacheHeaders(response, route);
    // a deep link preloads its own payload (lib/shell.ts): let the app use that copy
    if (route.kind !== "notfound" && route.kind !== "redirect") browserFresh(response);
    return response;
}

/** GET /api/app/ssr?path= : the hidden SSR DOM for a path, built by the same code as the HTML route. */
async function ssrHandler({ url }: Ctx): Promise<Response> {
    const target = pathParam(url, "ssr");
    if (target instanceof Response) return target;
    const route = await resolveAppRoute(target.pathname, target.search);
    if (route.kind === "redirect") {
        const response = await appJson(route satisfies AppSsr);
        setRouteCacheHeaders(response, route);
        return response;
    }
    const page = route.kind === "notfound" ? notFoundPage(target.pathname) : await renderRoute(route, target.pathname);
    const meta = headMeta(page.head, await cardImageUrl(page.head, url.origin));
    const payload: AppSsr = {
        kind: "ssr",
        status: page.status,
        title: meta.title,
        description: meta.description,
        canonical: meta.noindex ? null : meta.canonical,
        noindex: meta.noindex,
        og: {
            title: meta.ogTitle,
            description: meta.description,
            image: meta.ogImage,
            url: meta.canonical,
            type: meta.ogType,
        },
        // hidden under the app, as in the shell: its images must not download on every navigation
        html: quietImages(ssrMainHtml(page)),
    };
    const response = await appJson(payload);
    if (page.cache.kind === "none") response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60");
    else setPageCacheHeaders(response, page);
    return response;
}

const IMMUTABLE = "public, max-age=31536000, immutable";
const CID_RE = /^[a-z0-9]{20,}$/;
const FORMATS = new Set(["webp", "jpg", "png", "avif"]);

export function snapWidth(raw: string | null): number {
    const w = Number(raw);
    if (!raw || !Number.isFinite(w) || w <= 0) return 1920;
    return IMG_WIDTHS.find((p) => p >= w) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
}

function imgHeaders(extra: HeadersInit = {}): Headers {
    const h = new Headers(extra);
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Expose-Headers", "content-length, content-range, accept-ranges");
    h.set("Cache-Control", IMMUTABLE);
    h.set("Cross-Origin-Resource-Policy", "cross-origin");
    return h;
}

/** A miss or an upstream failure is not content-addressed: nothing may keep it. */
function imgError(status: 404 | 502): Response {
    const h = imgHeaders();
    h.set("Cache-Control", "no-store");
    h.set(EDGE_CACHE_HEADER, "no-store");
    return new Response(null, { status, headers: h });
}

/** Raw blobs (SVG among them) open as documents on this origin: no script, no fetches. */
const RAW_BLOB_CSP = "default-src 'none'; sandbox";

/** how long an upstream may take to answer with headers; the body streams on past it */
const UPSTREAM_HEADERS_MS = 8000;

async function fetchHeadersWithin(url: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), UPSTREAM_HEADERS_MS);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * The blob as stored. `fallback` marks a resize request that ended here because the blob's
 * meta or wsrv.nl was unavailable: that answer is kept briefly, not for a year, so the resize
 * is tried again soon.
 */
async function proxyBlob(cid: string, request: Request, fallback = false): Promise<Response> {
    const headers: Record<string, string> = { "User-Agent": "iammatthias.com/1.0 (+https://iammatthias.com)" };
    const range = request.headers.get("range");
    if (range) headers.Range = range;
    const key = readSecret("BLOBS_READ_KEY");
    if (key) headers.Authorization = `Bearer ${key}`;
    let upstream: Response;
    try {
        upstream = await fetchHeadersWithin(blobURL(cid), { headers, method: request.method === "HEAD" ? "HEAD" : "GET" });
    } catch {
        return imgError(502);
    }
    if (!upstream.ok && upstream.status !== 206) {
        await upstream.body?.cancel();
        return imgError(upstream.status === 404 ? 404 : 502);
    }
    const out = imgHeaders();
    if (fallback) {
        out.set("Cache-Control", "public, max-age=300");
        out.set(EDGE_CACHE_HEADER, "no-store");
    }
    out.set("Content-Security-Policy", RAW_BLOB_CSP);
    for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
        const v = upstream.headers.get(h);
        if (v) out.set(h, v);
    }
    if (!out.has("accept-ranges")) out.set("Accept-Ranges", "bytes");
    return new Response(upstream.body, { status: upstream.status, headers: out });
}

/**
 * GET /api/app/glass-image?src=<wsrv url> : the home hero's Glass photograph, for when the app's
 * own fetch of it from wsrv.nl fails (Safari's does at times; media::picture falls back here).
 * Only a wsrv.nl resize of a Glass CDN image, at one of the arch widths, is proxied.
 */
const GLASS_CDN_HOST = "cdn.glass.photo";
const GLASS_FORMATS = new Set(["webp", "jpg", "avif"]);

/** The wsrv.nl URL to fetch for `src`, rebuilt from its checked parts; null when it isn't a Glass pick. */
export function glassImageUpstream(src: string): string | null {
    let outer: URL;
    let inner: URL;
    try {
        outer = new URL(src);
        inner = new URL(outer.searchParams.get("url") ?? "");
    } catch {
        return null;
    }
    if (outer.protocol !== "https:" || outer.hostname !== "wsrv.nl") return null;
    if (inner.protocol !== "https:" || inner.hostname !== GLASS_CDN_HOST) return null;
    const width = Number(outer.searchParams.get("w"));
    if (!ARCH_WIDTHS.includes(width)) return null;
    const format = outer.searchParams.get("output") ?? "webp";
    if (!GLASS_FORMATS.has(format)) return null;
    return wsrvUrl(inner.toString(), width, { format: format as "webp" | "jpg" | "avif" });
}

/** `target` as a raster image, or null (with the reason logged) when it isn't one. */
async function fetchImage(target: string): Promise<{ body: ReadableStream; type: string } | null> {
    let upstream: Response;
    try {
        upstream = await fetch(target, {
            // a failure is never kept: cacheTtl alone would hold it for the day
            cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 86400, "300-599": -1 } },
            signal: AbortSignal.timeout(8000),
        } as RequestInit);
    } catch (err) {
        console.warn("[glass-image]", new URL(target).hostname, String(err));
        return null;
    }
    const type = (upstream.headers.get("Content-Type") ?? "").toLowerCase();
    if (upstream.ok && upstream.body && type.startsWith("image/") && !type.startsWith("image/svg+xml")) {
        return { body: upstream.body, type };
    }
    const said = type.startsWith("text/") ? (await upstream.text()).slice(0, 200) : "";
    if (!said) await upstream.body?.cancel();
    console.warn("[glass-image]", new URL(target).hostname, upstream.status, type, said);
    return null;
}

async function glassImageHandler({ url }: Ctx): Promise<Response> {
    const target = glassImageUpstream(url.searchParams.get("src") ?? "");
    if (!target) return new Response(null, { status: 400 });
    // wsrv.nl turns some Worker requests away (Cloudflare error 1106): then the Glass original,
    // larger and a JPEG, but the photograph
    const image = (await fetchImage(target)) ?? (await fetchImage(new URL(target).searchParams.get("url")!));
    if (!image) return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
    return new Response(image.body, {
        headers: {
            "Content-Type": image.type,
            "Cache-Control": "public, max-age=86400",
        },
    });
}

/**
 * GET /img/<cid>?w=<width>[&f=webp|jpg|png|avif]
 * Images are resized by wsrv.nl (width snapped up to IMG_WIDTHS, default
 * 1920); video, audio, and other blobs stream from blobs.farfield.systems
 * with Range passthrough. A cid is a content hash, so everything is immutable.
 */
async function imgHandler({ request, url, params, exec }: Ctx): Promise<Response> {
    const cid = params[0];
    if (!CID_RE.test(cid)) return imgError(404);
    if (url.searchParams.has("raw")) return proxyBlob(cid, request);

    const width = snapWidth(url.searchParams.get("w"));
    const f = url.searchParams.get("f") ?? "webp";
    const format = (FORMATS.has(f) ? f : "webp") as "webp" | "jpg" | "avif";
    // only a raster's resize is ever stored under this key, so a hit needs no meta lookup
    const cacheKey = new Request(`${url.origin}/img/${cid}?w=${width}&f=${format}`);
    const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
    const hit = cache ? await cache.match(cacheKey).catch(() => undefined) : undefined;
    if (hit) return request.method === "HEAD" ? new Response(null, hit) : hit;

    const meta = await getBlobMeta(cid);
    // no meta: unknown whether this is a raster, so the blob itself stands in for now
    if (!meta) return proxyBlob(cid, request, true);
    const isRaster = meta.mime.startsWith("image/") && meta.mime !== "image/svg+xml" && meta.mime !== "image/gif";
    if (!isRaster) return proxyBlob(cid, request);

    let upstream: Response;
    try {
        upstream = await fetchHeadersWithin(wsrvUrl(blobURL(cid), width, { format }), {
            headers: { "User-Agent": "iammatthias.com/1.0 (+https://iammatthias.com)" },
        });
    } catch {
        return proxyBlob(cid, request, true);
    }
    if (!upstream.ok) {
        await upstream.body?.cancel();
        return proxyBlob(cid, request, true);
    }
    const body = await upstream.arrayBuffer();
    const headers = imgHeaders({ "Content-Type": upstream.headers.get("content-type") ?? `image/${format}` });
    headers.set("Vary", "Accept-Encoding");
    const response = new Response(body, { headers });
    if (cache) exec.waitUntil(cache.put(cacheKey, response.clone()).catch(() => undefined));
    return request.method === "HEAD" ? new Response(null, response) : response;
}

function appMissing({ url }: Ctx): Response {
    return jsonError(
        404,
        "endpoint_not_found",
        `No app endpoint at ${url.pathname}.`,
        "The app API serves /api/app/index, /api/app/route?path=<path> and /api/app/ssr?path=<path>.",
    );
}

const GET = ["GET", "HEAD"];

export const appRoutes: Route[] = [
    { methods: GET, pattern: /^\/api\/app\/index$/, handler: indexHandler },
    { methods: GET, pattern: /^\/api\/app\/route$/, handler: routeHandler },
    { methods: GET, pattern: /^\/api\/app\/timeline$/, handler: timelineHandler },
    { methods: GET, pattern: /^\/api\/app\/ssr$/, handler: ssrHandler },
    // the same artwork under /api/app, which the app (and its dev proxy) fetch from
    { methods: GET, pattern: /^\/api\/app\/glass-image$/, handler: glassImageHandler },
    { methods: GET, pattern: /^\/api\/app\/.*$/, handler: appMissing },
    { methods: GET, pattern: /^\/img\/([^/]+)$/, handler: imgHandler },
];
