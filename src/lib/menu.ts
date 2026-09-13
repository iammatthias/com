
import { getCollection, getLiveCollection } from "astro:content";
import { memo } from "./memo";

export interface MenuMeta {
    group: string;
    label?: string;
    order?: number;
    href?: string;
}

export const GROUP_ORDER = [
    "",
    "publications",
    "archive",
    "personal",
    "other",
];

export interface PublicationLink {
    href: string;
    label: string;
    order: number;
}

async function loadPublicationLinks(): Promise<PublicationLink[]> {
    const [pubResult, docResult] = await Promise.all([
        getLiveCollection("publications"),
        getLiveCollection("documents"),
    ]);
    if (pubResult.error) throw pubResult.error;
    const builtPubs = import.meta.env.DEV
        ? null
        : new Set(
              (await getCollection("pubs")).map(
                  (e) => (e.data as { slug: string }).slug,
              ),
          );
    const publishedSlugs = new Set(
        (docResult.entries ?? []).map(
            (e: { data: { collection: string } }) => e.data.collection,
        ),
    );
    const hasContent = (slug: string, count: number | undefined): boolean => {
        if (docResult.error) {
            return typeof count !== "number" || count > 0;
        }
        return publishedSlugs.has(slug);
    };
    return pubResult.entries
        .filter(
            (p) =>
                hasContent(p.data.slug, p.data.entryCount) &&
                (!builtPubs || builtPubs.has(p.data.slug)),
        )
        .map((p, i) => ({
            href: `/${p.data.slug}`,
            label: p.data.name.toLowerCase(),
            order: i,
        }));
}

export function getPublicationLinks(): Promise<PublicationLink[]> {
    return memo("publication-links", loadPublicationLinks, {
        onError: (err, stale) => {
            console.error("[menu] Farfield publications fetch failed:", err);
            return stale ?? [];
        },
    });
}
