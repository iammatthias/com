import { SITE_ORIGIN } from "./agent-surface";

export function siteOrigin(site: URL | string | undefined): string {
    return (site?.toString() ?? SITE_ORIGIN).replace(/\/$/, "");
}

export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const out = new Array<R>(items.length);
    let next = 0;
    const workerCount = Math.min(limit, items.length);
    await Promise.all(
        Array.from({ length: workerCount }, async () => {
            while (next < items.length) {
                const i = next++;
                out[i] = await fn(items[i], i);
            }
        }),
    );
    return out;
}

/** What Cloudflare's asset layer sends for the old site's static files. */
export const ASSET_CACHE_CONTROL = "public, max-age=0, must-revalidate";

/** A strong validator over the exact body bytes (first 128 bits of SHA-256). */
export async function etagFor(body: string | Uint8Array): Promise<string> {
    const bytes = typeof body === "string" ? new TextEncoder().encode(body) : body;
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    return `"${[...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("")}"`;
}

/**
 * A file the old site shipped from `public/` (or prerendered): same
 * Cache-Control as the asset layer, plus an ETag so revalidation is a 304.
 * `contentType: null` sends no Content-Type at all, as the asset layer does
 * for extensionless files.
 */
export async function assetResponse(
    body: string,
    contentType: string | null,
    cacheControl = ASSET_CACHE_CONTROL,
): Promise<Response> {
    const bytes = new TextEncoder().encode(body);
    const headers = new Headers({ "Cache-Control": cacheControl, ETag: await etagFor(bytes) });
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(bytes, { headers });
}

/** What a Range header asks of a body of `size` bytes: all of it (no range, or one this doesn't
 *  serve: several at once, or malformed), one slice, or bytes the body doesn't have (a 416). */
export type ByteRange = { kind: "whole" } | { kind: "part"; start: number; end: number } | { kind: "none" };

/** RFC 9110 Range, single `bytes=` ranges only: `a-b`, `a-` and the suffix `-n`. */
export function byteRange(header: string | null, size: number): ByteRange {
    const m = header?.match(/^bytes=(\d*)-(\d*)$/);
    if (!m || (m[1] === "" && m[2] === "")) return { kind: "whole" };
    if (m[1] === "") {
        const suffix = Number(m[2]);
        if (suffix === 0 || size === 0) return { kind: "none" };
        return { kind: "part", start: Math.max(size - suffix, 0), end: size - 1 };
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start >= size || start > end) return { kind: "none" };
    return { kind: "part", start, end };
}

/** RFC 9110 If-None-Match against a strong ETag (weak comparison, as GET allows). */
export function etagMatches(ifNoneMatch: string | null, etag: string | null): boolean {
    if (!ifNoneMatch || !etag) return false;
    const bare = etag.replace(/^W\//, "");
    return ifNoneMatch
        .split(",")
        .map((t) => t.trim())
        .some((t) => t === "*" || t.replace(/^W\//, "") === bare);
}
