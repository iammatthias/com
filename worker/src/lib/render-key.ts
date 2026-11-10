import { extractBodyEmbeds } from "./embeds";

export function seriesSlugs(body: string): string[] {
    return [
        ...new Set(
            extractBodyEmbeds(body)
                .filter((e) => e.scheme === "series")
                .map((e) => e.id),
        ),
    ];
}

export function seriesKeyFor(body: string, index: Map<string, string>): string {
    return seriesSlugs(body)
        .sort()
        .map((slug) => `${slug}:${index.get(slug) ?? "missing"}`)
        .join(",");
}

export function withSeriesKey(cid: string, seriesKey: string): string {
    return seriesKey ? `${cid}@${seriesKey}` : cid;
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
