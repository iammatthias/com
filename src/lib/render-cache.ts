// Rendered-output cache keyed by record cid.
//
// A Farfield cid is a hash of the record's content, so for a fixed
// renderer the output is a pure function of the cid — cacheable with
// no revalidation. The mutable question — "which cid does this slug
// point at right now?" — stays with the entry fetch, which revalidates
// cheaply via its ETag.
//
// One consumer today: the feed-entry markdown twin (/feed/[rkey].md,
// kind "feedmdbody"), the only doc surface still rendered per request.
// The HTML detail pages that this cache once covered are prerendered
// now and never touch it.
//
// Entries expire after 90 days (refreshed on every miss-write) purely
// to garbage-collect renders of edited/deleted content and abandoned
// RENDER_VERSIONs; a hit within the window is always valid.

import { getContentCache } from "./runtime-env";

/**
 * Bump this whenever the markdown-twin pipeline's *output* changes —
 * markdown-view.ts embed resolution feeding the "feedmdbody" kind —
 * or stale output will serve for up to the TTL. Data-only changes
 * (new content) never need a bump: new content means new cids.
 */
const RENDER_VERSION = 1;

const RENDER_TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * Return the cached render for (kind, cid), or run `render` and cache
 * its result. `kind` namespaces surfaces with different markup for the
 * same record (e.g. "doc" vs a feed variant). Falls straight through
 * to `render()` wherever KV isn't bound (build-time prerender, node).
 */
export async function cachedRender(
    kind: string,
    cid: string,
    render: () => Promise<string>,
): Promise<string> {
    const kv = await getContentCache();
    const key = `render:v${RENDER_VERSION}:${kind}:${cid}`;
    if (kv) {
        try {
            const hit = await kv.get(key, "text");
            if (hit !== null) return hit;
        } catch {
            /* fall through to a live render */
        }
    }
    const html = await render();
    if (kv) {
        try {
            await kv.put(key, html, { expirationTtl: RENDER_TTL_SECONDS });
        } catch {
            /* cache write failure never blocks the response */
        }
    }
    return html;
}
