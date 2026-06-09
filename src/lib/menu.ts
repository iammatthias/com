/**
 * Frontmatter-driven menu metadata. Pages opt into the site menu by
 * exporting a `menu` constant matching this shape from their Astro
 * frontmatter:
 *
 *   export const menu: MenuMeta = {
 *     group: "personal",
 *     order: 1,
 *   };
 *
 * MenuLinks.astro discovers these via `import.meta.glob` at build
 * time — no manual list to maintain. Pages without a `menu` export
 * are excluded by default.
 */

import { getLiveCollection } from "astro:content";

export interface MenuMeta {
    /** Group label this page falls under, e.g. "archive" or "personal". */
    group: string;
    /**
     * Display label. Defaults to the page's URL slug. Use this to
     * override casing or formatting (e.g. "open source" not "open-source").
     */
    label?: string;
    /** Sort order within the group. Lower = first. Defaults to 0. */
    order?: number;
    /** Override the auto-derived URL. Rarely needed. */
    href?: string;
}

/**
 * Fixed group rendering order. Groups not in this list are appended
 * alphabetically. The empty string is the implicit "no group" / top
 * section (used for the home link).
 */
export const GROUP_ORDER = [
    "",
    "publications",
    "archive",
    "personal",
    "other",
];

/* ── publications from Farfield (live collection) ──────────────────── */

export interface PublicationLink {
    href: string;
    label: string;
    order: number;
}

// MenuLinks renders on every SSR page (the layout's menu dialog) plus
// /menu, so the composed publication links are memoized at module
// scope with the same 60s TTL as the loader cache — per-render cost is
// a map lookup instead of two collection reads + a recompose. Errors
// are never cached: a transient upstream blip serves the previous
// (stale) list when one exists, an empty section otherwise.
const PUB_LINKS_TTL_MS = 60_000;
let pubLinksCache: { links: PublicationLink[]; expires: number } | null =
    null;
let pubLinksInFlight: Promise<PublicationLink[]> | null = null;

async function loadPublicationLinks(): Promise<PublicationLink[]> {
    // Publications come from `/api/collections` (metadata, includes
    // drafts in `entryCount`). To advertise only collections with
    // public content, intersect against the documents collection — that
    // endpoint returns published entries only. Empty collections (like
    // melange while drafts cook) drop out of the menu but their routes
    // still work for direct visits.
    const [pubResult, docResult] = await Promise.all([
        getLiveCollection("publications"),
        getLiveCollection("documents"),
    ]);
    if (pubResult.error) throw pubResult.error;
    const publishedSlugs = new Set(
        (docResult.entries ?? []).map(
            (e: { data: { collection: string } }) => e.data.collection,
        ),
    );
    // Fall back to the metadata's entryCount if the documents fetch
    // errored — better to over-advertise than to silently empty the
    // menu on a transient upstream blip.
    const hasContent = (slug: string, count: number | undefined): boolean => {
        if (docResult.error) {
            return typeof count !== "number" || count > 0;
        }
        return publishedSlugs.has(slug);
    };
    return pubResult.entries
        .filter((p) => hasContent(p.data.slug, p.data.entryCount))
        .map((p, i) => ({
            href: `/${p.data.slug}`,
            label: p.data.name.toLowerCase(),
            order: i,
        }));
}

/** Publication menu links, memoized per isolate for 60s. */
export function getPublicationLinks(): Promise<PublicationLink[]> {
    const now = Date.now();
    if (pubLinksCache && pubLinksCache.expires > now) {
        return Promise.resolve(pubLinksCache.links);
    }
    if (pubLinksInFlight) return pubLinksInFlight;
    pubLinksInFlight = loadPublicationLinks()
        .then((links) => {
            pubLinksCache = { links, expires: now + PUB_LINKS_TTL_MS };
            pubLinksInFlight = null;
            return links;
        })
        .catch((err) => {
            pubLinksInFlight = null;
            console.error(
                "[menu] Farfield publications fetch failed:",
                err,
            );
            return pubLinksCache?.links ?? [];
        });
    return pubLinksInFlight;
}
