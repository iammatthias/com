export interface CacheHintLike {
    lastModified?: Date;
    tags?: string[];
}

export interface CacheHeaderOptions {
    maxAge?: number;
    swr?: number;
    extraTags?: string[];
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
        `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    );
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
