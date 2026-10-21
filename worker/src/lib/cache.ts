import { DOCUMENTS_TAG, FEED_TAG } from "./revalidate";
import type { CachePolicy } from "./ssr";
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

/** The feedEntries collection's cache hint in com: newest entry's createdAt, tagged feed-entries. */
export function feedCacheHint(items: ReadonlyArray<{ createdAt: string }>): Required<CacheHintLike> {
    return {
        lastModified: items.length ? new Date(items[0].createdAt) : new Date(),
        tags: [FEED_TAG],
    };
}

/**
 * A `series` webhook purges `documents` only, so a feed payload that embeds a
 * series has to carry that tag or it would outlive the series edit.
 */
export function seriesTags(posts: ReadonlyArray<{ body: string }>): string[] {
    return posts.some((p) => p.body.includes("series://")) ? [DOCUMENTS_TAG] : [];
}

export const EDGE_CACHE_HEADER = "Cloudflare-CDN-Cache-Control";
const EDGE_STALE_SECONDS = 24 * 60 * 60;
const EDGE_STALE_IF_ERROR_SECONDS = 7 * 24 * 60 * 60;

export function edgeCacheDirective(maxAge: number): string {
    return `public, max-age=${maxAge}, stale-while-revalidate=${EDGE_STALE_SECONDS}, stale-if-error=${EDGE_STALE_IF_ERROR_SECONDS}`;
}

const DEFAULT_MAX_AGE_SECONDS = 60;
const DOCUMENT_PAGE_MAX_AGE_SECONDS = 60 * 60;
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

export function setDocumentPageCacheHeaders(
    response: { headers: Headers },
    extraTags: string[] = [],
): void {
    setResponseCacheHeaders(response, undefined, {
        maxAge: DOCUMENT_PAGE_MAX_AGE_SECONDS,
        swr: DOCUMENT_PAGE_MAX_AGE_SECONDS,
        edge: true,
        extraTags: [DOCUMENTS_TAG, ...extraTags],
    });
}

/**
 * HTML pages (and their /api/app/ssr twins) are rendered by this Worker's own
 * code, so a deploy can change them: they always carry `shell` alongside the
 * content tags of what they embed.
 */
export const SHELL_TAG = "shell";

export function setPageCacheHeaders(res: { headers: Headers }, page: { cache: CachePolicy }): void {
    const extraTags = [SHELL_TAG];
    switch (page.cache.kind) {
        case "document":
            setDocumentPageCacheHeaders(res, extraTags);
            return;
        case "home":
            setResponseCacheHeaders(
                res,
                { lastModified: page.cache.lastModified, tags: [FEED_TAG] },
                { edge: true, extraTags: [DOCUMENTS_TAG, ...extraTags] },
            );
            return;
        case "feed":
            setResponseCacheHeaders(
                res,
                { tags: [FEED_TAG] },
                {
                    ...deepPageCacheOptions(page.cache.page ?? 1),
                    edge: page.cache.edge,
                    extraTags: [...(page.cache.extraTags ?? []), ...extraTags],
                },
            );
            return;
        case "now":
            setResponseCacheHeaders(
                res,
                { lastModified: page.cache.lastModified, tags: [FEED_TAG] },
                { edge: true, extraTags: [DOCUMENTS_TAG, ...extraTags] },
            );
            return;
        case "static":
            setResponseCacheHeaders(res, undefined, { maxAge: 3600, swr: 86400, edge: true, extraTags });
            return;
        case "long":
            setResponseCacheHeaders(res, undefined, { maxAge: 86400, swr: 604800, edge: true, extraTags });
            return;
        case "none":
            return;
    }
}
