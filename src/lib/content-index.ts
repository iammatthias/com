// Shared data loading for the all-content index. `/content` (page 1,
// content/index.astro) and `/content/page/N` (content/page/[page].astro)
// are separate routes for legacy-redirect reasons but need identical
// data — this keeps that logic in one place. Reads the build-time
// collections: both routes are prerendered.

import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "./farfield-loader";

export interface ContentIndexData {
    items: DocumentData[];
    pubs: PublicationData[];
}

export async function loadContentIndex(): Promise<ContentIndexData> {
    const items = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    return { items, pubs };
}
