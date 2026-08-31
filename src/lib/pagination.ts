import { createHash } from "node:crypto";

export const PAGE_SIZE = 12;

export interface PageData<T> {
    items: T[];
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    basePath: string;
    prevHref: string | null;
    nextHref: string | null;
}

const PAGE_SEGMENT_RE = /^page\/([1-9][0-9]*)$/;
const FIRST_PAGE_LIVES_AT_BARE_INDEX = 2;

export function parsePageParam(rest: string | undefined): number | null {
    if (!rest) return 1;
    const match = PAGE_SEGMENT_RE.exec(rest);
    if (!match) return null;
    const page = Number(match[1]);
    return page >= FIRST_PAGE_LIVES_AT_BARE_INDEX ? page : null;
}

export function getPage<T>(
    all: T[],
    page: number,
    basePath: string,
    pageSize: number = PAGE_SIZE,
): PageData<T> | null {
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const outOfRange = page < 1 || page > totalPages;
    if (outOfRange) return null;
    const start = (page - 1) * pageSize;
    return {
        items: all.slice(start, start + pageSize),
        page,
        totalPages,
        total,
        pageSize,
        basePath,
        prevHref: page > 1 ? pageHref(basePath, page - 1) : null,
        nextHref: page < totalPages ? pageHref(basePath, page + 1) : null,
    };
}

export function pageHref(basePath: string, page: number): string {
    return page <= 1 ? basePath : `${basePath}/page/${page}`;
}

export function paginationCacheKey(
    page: number,
    totalPages: number,
    cids: string[],
): string {
    return createHash("sha1")
        .update(`${page}/${totalPages}:${cids.join(",")}`)
        .digest("hex");
}
