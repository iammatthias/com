import { DOCUMENTS_TAG, FEED_TAG } from "./revalidate";
import type { AppRoute } from "../app-api";
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

export function feedCacheHint(items: ReadonlyArray<{ createdAt: string }>): Required<CacheHintLike> {
    return {
        lastModified: items.length ? new Date(items[0].createdAt) : new Date(),
        tags: [FEED_TAG],
    };
}

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

export const SHELL_TAG = "shell";

export type CachePolicy =
    | { kind: "document" }
    | { kind: "feed"; page?: number; extraTags: string[] }
    | { kind: "home" }
    | { kind: "now" }
    | { kind: "static" }
    | { kind: "none" };

export function cachePolicyFor(route: AppRoute): CachePolicy {
    switch (route.kind) {
        case "doc":
        case "list":
        case "tags":
        case "tag":
        case "content":
        case "redirect":
            return { kind: "document" };
        case "home":
        case "now":
            return { kind: route.kind };
        case "feed":
            return { kind: "feed", page: route.page, extraTags: seriesTags(route.posts) };
        case "post":
            return { kind: "feed", extraTags: seriesTags([route.post]) };
        case "page":
            return route.slug === "menu" ? { kind: "document" } : { kind: "static" };
        case "resume":
        case "developers":
            return { kind: "static" };
        case "notfound":
            return { kind: "none" };
    }
}

export function setPageCacheHeaders(res: { headers: Headers }, policy: CachePolicy, { shell }: { shell: boolean }): void {
    const extraTags = shell ? [SHELL_TAG] : [];
    switch (policy.kind) {
        case "document":
            setDocumentPageCacheHeaders(res, extraTags);
            return;
        case "home":
        case "now":
            setResponseCacheHeaders(res, { tags: [FEED_TAG] }, { edge: true, extraTags: [DOCUMENTS_TAG, ...extraTags] });
            return;
        case "feed":
            setResponseCacheHeaders(
                res,
                { tags: [FEED_TAG] },
                {
                    ...deepPageCacheOptions(policy.page ?? 1),
                    edge: true,
                    extraTags: [...policy.extraTags, ...extraTags],
                },
            );
            return;
        case "static":
            setResponseCacheHeaders(res, undefined, { maxAge: 3600, swr: 86400, edge: true, extraTags: [SHELL_TAG] });
            return;
        case "none":
            res.headers.set("Cache-Control", "public, max-age=0, s-maxage=60");
            return;
    }
}

export function setShellCacheHeaders(res: { headers: Headers }, policy: CachePolicy): void {
    setPageCacheHeaders(res, policy, { shell: true });
    res.headers.set("Cache-Control", "no-cache");
}
