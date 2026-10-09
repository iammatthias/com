import { extractBodyEmbeds } from "./embeds";

/**
 * A document's body can embed a series, whose contents live in a different
 * record. `![](series://slug)` stays byte-identical while that record is
 * rewritten, so the document's own cid cannot detect the change — the
 * embedded series' cids have to ride along in the key.
 */
export function seriesKeyFor(body: string, index: Map<string, string>): string {
    const slugs = [
        ...new Set(
            extractBodyEmbeds(body)
                .filter((e) => e.scheme === "series")
                .map((e) => e.id),
        ),
    ].sort();
    return slugs.map((slug) => `${slug}:${index.get(slug) ?? "missing"}`).join(",");
}

export function renderKey(doc: {
    cid: string;
    publishedAt: string;
    updatedAt: string;
    seriesKey?: string;
    publication?: { name: string; description?: string };
}): string {
    const base = `${doc.cid}@${doc.publishedAt}@${doc.updatedAt}`;
    const withSeries = doc.seriesKey ? `${base}@${doc.seriesKey}` : base;
    return doc.publication
        ? `${withSeries}@${doc.publication.name}|${doc.publication.description ?? ""}`
        : withSeries;
}
