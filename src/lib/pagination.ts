// View-layer pagination for the live-content list surfaces.
//
// The Farfield loaders return each collection's full, already-sorted set
// (small JSON, TTL-cached per isolate — see farfield-loader.ts), so
// paging is a pure slice at the page level: no loader changes, no
// upstream cursor. URLs are path-based — page 1 is the bare index
// (`/content`), pages 2+ live at `/content/page/N`. Each surface is a
// single `[...page].astro` catch-all that parses its rest param through
// `parsePageParam` and slices via `getPage`.

export const PAGE_SIZE = 12;

export interface PageData<T> {
    /** The slice of items for the current page. */
    items: T[];
    /** 1-based current page. */
    page: number;
    /** Total page count — at least 1, even for an empty set. */
    totalPages: number;
    /** Total item count across all pages. */
    total: number;
    pageSize: number;
    /** Surface root, e.g. "/content" or "/tags/cooking". No trailing slash. */
    basePath: string;
}

/**
 * Parse a `[...page]` rest param into a 1-based page number.
 *   - undefined / ""        → 1   (the bare index)
 *   - "page/2", "page/3", … → 2, 3, …
 *   - anything else         → null (caller responds 404)
 *
 * The `page/1` form is intentionally rejected: page 1 has a canonical
 * home at the bare index, so `/content/page/1` must not also exist. The
 * regex also rejects leading zeros ("page/02"), non-numerics, and any
 * deeper/garbage path so a catch-all can't render the list for arbitrary
 * URLs like `/content/foo/bar`.
 */
export function parsePageParam(rest: string | undefined): number | null {
    if (!rest) return 1;
    const match = /^page\/([1-9][0-9]*)$/.exec(rest);
    if (!match) return null;
    const n = Number(match[1]);
    return n >= 2 ? n : null;
}

/**
 * Slice `all` to the requested page. Returns null when the page is out
 * of range (beyond the last page of a non-empty set) so the caller can
 * 404 rather than serve an empty, indexable page. Page 1 of an empty set
 * is valid — it renders the surface's empty state.
 */
export function getPage<T>(
    all: T[],
    page: number,
    basePath: string,
    pageSize: number = PAGE_SIZE,
): PageData<T> | null {
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page < 1 || page > totalPages) return null;
    const start = (page - 1) * pageSize;
    return {
        items: all.slice(start, start + pageSize),
        page,
        totalPages,
        total,
        pageSize,
        basePath,
    };
}

/** Build the href for a given page under `basePath` (page 1 → basePath). */
export function pageHref(basePath: string, page: number): string {
    return page <= 1 ? basePath : `${basePath}/page/${page}`;
}

/**
 * Parse the explicit `[page]` segment of `/<base>/page/N` into a page
 * number ≥ 2. Returns null for non-numerics, leading zeros, or N < 2
 * (page 1 lives at the bare index). The `page/N` half of `parsePageParam`
 * for surfaces that use an explicit `page/[page].astro` route instead of
 * a `[...page]` catch-all — used by /content, whose `/content` index must
 * be a concrete route so the legacy redirects in astro.config can target
 * it.
 */
export function parsePageSegment(raw: string | undefined): number | null {
    if (!raw || !/^[1-9][0-9]*$/.test(raw)) return null;
    const n = Number(raw);
    return n >= 2 ? n : null;
}
