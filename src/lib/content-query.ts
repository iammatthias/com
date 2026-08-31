import { getCollection } from "astro:content";
import type { DocumentData } from "@lib/farfield-loader";

export async function publishedDocs(): Promise<DocumentData[]> {
    return (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

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

export const RELATED_COUNT = 6;

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

let keysOfDocsBuiltIntoThisDeploy: Set<string> | null = null;

export async function builtDocFilter(): Promise<
    (d: Pick<DocumentData, "collection" | "rkey">) => boolean
> {
    const everyRouteRendersOnDemand = import.meta.env.DEV;
    if (everyRouteRendersOnDemand) return () => true;
    if (!keysOfDocsBuiltIntoThisDeploy) {
        keysOfDocsBuiltIntoThisDeploy = new Set(
            (await getCollection("docs")).map((e) => {
                const d = e.data as DocumentData;
                return `${d.collection}/${d.rkey}`;
            }),
        );
    }
    const built = keysOfDocsBuiltIntoThisDeploy;
    return (d) => built.has(`${d.collection}/${d.rkey}`);
}
