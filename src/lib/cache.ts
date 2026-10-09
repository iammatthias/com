interface CacheHintLike {
    lastModified?: Date;
    tags?: string[];
}

interface CacheHeaderOptions {
    maxAge?: number;
    swr?: number;
    extraTags?: string[];
    edge?: boolean;
}

export const EDGE_CACHE_HEADER = "Cloudflare-CDN-Cache-Control";
const EDGE_STALE_SECONDS = 24 * 60 * 60;
const EDGE_STALE_IF_ERROR_SECONDS = 7 * 24 * 60 * 60;

export function edgeCacheDirective(maxAge: number): string {
    return `public, max-age=${maxAge}, stale-while-revalidate=${EDGE_STALE_SECONDS}, stale-if-error=${EDGE_STALE_IF_ERROR_SECONDS}`;
}

const DEFAULT_MAX_AGE_SECONDS = 60;
const DEFAULT_SWR_SECONDS = 300;
const DEEP_PAGE_MAX_AGE_SECONDS = 300;
const DEEP_PAGE_SWR_SECONDS = 600;

export function deepPageCacheOptions(page: number): CacheHeaderOptions {
    const isDeepPage = page > 1;
    return isDeepPage
        ? { maxAge: DEEP_PAGE_MAX_AGE_SECONDS, swr: DEEP_PAGE_SWR_SECONDS }
        : {};
}

const PER_ENTRY_TAG = /^(doc-|cid-|feed-entry-)/;

export function setResponseCacheHeaders(
    response: { headers: Headers },
    cacheHint?: CacheHintLike,
    opts: CacheHeaderOptions = {},
): void {
    const maxAge = opts.maxAge ?? DEFAULT_MAX_AGE_SECONDS;
    const swr = opts.swr ?? DEFAULT_SWR_SECONDS;
    response.headers.set(
        "Cache-Control",
        `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    );
    if (opts.edge) {
        response.headers.set(EDGE_CACHE_HEADER, edgeCacheDirective(maxAge));
    }
    if (cacheHint?.lastModified) {
        response.headers.set(
            "Last-Modified",
            cacheHint.lastModified.toUTCString(),
        );
    }
    const surfaceLevelTags = [
        ...(cacheHint?.tags ?? []),
        ...(opts.extraTags ?? []),
    ].filter((t) => !PER_ENTRY_TAG.test(t));
    if (surfaceLevelTags.length > 0) {
        response.headers.set("Cache-Tag", [...new Set(surfaceLevelTags)].join(","));
    }
}
