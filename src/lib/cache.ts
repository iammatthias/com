// Response-level cache header helpers.
//
// SSR pages and API routes all share the same cache policy:
// `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` so
// Cloudflare's edge holds rendered HTML for 60s and serves stale for
// up to 5 more minutes while refreshing in the background. The
// loaders' `cacheHint` (lastModified + tags) becomes the Last-Modified
// and Cache-Tag headers so the same lever can drive both client-side
// freshness checks and Cloudflare cache invalidation.

/**
 * Subset of Astro's `cacheHint` shape that we actually consume. Loosely
 * typed so consumers don't have to import Astro's internal types.
 */
export interface CacheHintLike {
    lastModified?: Date;
    tags?: string[];
}

export interface CacheHeaderOptions {
    /** Cache lifetime at the edge before SWR kicks in. Default 60s. */
    maxAge?: number;
    /** SWR window — edge serves stale this long while refreshing. Default 300s. */
    swr?: number;
    /**
     * Extra cache tags to merge with whatever the loader emitted. Used
     * when a page draws from multiple collections and wants both
     * source tags on the response (e.g. /content reads docs + pubs).
     */
    extraTags?: string[];
}

/**
 * Apply our standard cache policy to an SSR response, plus the
 * loader's freshness hint (Last-Modified + Cache-Tag). Mutates the
 * passed response in place. Tag list is deduped — convenient when
 * merging hints from multiple loaders.
 */
export function setResponseCacheHeaders(
    response: { headers: Headers },
    cacheHint?: CacheHintLike,
    opts: CacheHeaderOptions = {},
): void {
    const maxAge = opts.maxAge ?? 60;
    const swr = opts.swr ?? 300;
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
    const tags = [
        ...(cacheHint?.tags ?? []),
        ...(opts.extraTags ?? []),
    ];
    if (tags.length > 0) {
        const deduped = [...new Set(tags)];
        response.headers.set("Cache-Tag", deduped.join(","));
    }
}
