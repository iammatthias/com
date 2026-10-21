import type { DocumentData } from "./farfield-loader";

const RELATED_COUNT = 6;

export function relatedDocs(
    doc: DocumentData,
    all: DocumentData[],
    n: number = RELATED_COUNT,
): DocumentData[] {
    const sharedTagCount = (tags: string[]) =>
        tags.filter((t) => doc.tags.includes(t)).length;
    return all
        .filter(
            (d) =>
                d.published !== false &&
                !(d.collection === doc.collection && d.rkey === doc.rkey),
        )
        .sort(
            (a, b) =>
                sharedTagCount(b.tags) - sharedTagCount(a.tags) ||
                b.publishedAt.localeCompare(a.publishedAt),
        )
        .slice(0, n);
}
