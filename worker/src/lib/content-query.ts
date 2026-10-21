import {
    livePublications,
    loadAllDocuments,
    type DocumentData,
    type PublicationData,
} from "./farfield-loader";
import { relatedDocs } from "./related";

export async function publishedDocs(): Promise<DocumentData[]> {
    return (await loadAllDocuments()).filter((d) => d.published !== false);
}

export async function documentForRoute(
    collection: string | undefined,
    rkey: string | undefined,
): Promise<{ doc: DocumentData; related: DocumentData[] } | null> {
    const withDrafts = false;
    const all = await loadAllDocuments(withDrafts);
    const doc = all.find((d) => d.collection === collection && d.rkey === rkey);
    if (!doc || (!withDrafts && doc.published === false)) return null;
    return { doc, related: relatedDocs(doc, all) };
}

export async function sectionForRoute(
    slug: string | undefined,
): Promise<{ pub: PublicationData; items: DocumentData[] } | null> {
    const [pubs, docs] = await Promise.all([livePublications(), publishedDocs()]);
    const pub = pubs.find((p) => p.slug === slug);
    if (!pub) return null;
    return { pub, items: docs.filter((d) => d.collection === pub.slug) };
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

export { relatedDocs };
