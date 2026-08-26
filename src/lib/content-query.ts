// Build-time queries over the docs collection. The "published docs,
// newest first" filter+sort and the related-reading scoring used to be
// hand-copied across routes and had already drifted (the HTML detail
// page showed 6 related entries, its markdown twin 5). One definition.

import { getCollection } from "astro:content";
import type { DocumentData } from "@lib/farfield-loader";

/** Published documents, newest first. */
export async function publishedDocs(): Promise<DocumentData[]> {
    return (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Published documents grouped by tag, newest first within each tag. */
export async function documentsByTag(): Promise<Map<string, DocumentData[]>> {
    const byTag = new Map<string, DocumentData[]>();
    for (const d of await publishedDocs()) {
        for (const t of d.tags) {
            const list = byTag.get(t);
            if (list) list.push(d);
            else byTag.set(t, [d]);
        }
    }
    return byTag;
}

/** How many related entries a document surface shows. */
export const RELATED_COUNT = 6;

/**
 * Related reading: shared-tag count, then recency. Drafts never appear
 * as related. Both the HTML detail page and its markdown twin call
 * this, so the two representations agree about what's related.
 */
export function relatedDocs(
    doc: DocumentData,
    all: DocumentData[],
    n: number = RELATED_COUNT,
): DocumentData[] {
    const shared = (tags: string[]) =>
        tags.filter((t) => doc.tags.includes(t)).length;
    return all
        .filter(
            (d) =>
                d.published !== false &&
                !(d.collection === doc.collection && d.rkey === doc.rkey),
        )
        .sort(
            (a, b) =>
                shared(b.tags) - shared(a.tags) ||
                b.publishedAt.localeCompare(a.publishedAt),
        )
        .slice(0, n);
}
