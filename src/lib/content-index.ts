
import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "./farfield-loader";
import { publishedDocs } from "./content-query";

export interface ContentIndexData {
    items: DocumentData[];
    pubs: PublicationData[];
}

export async function loadContentIndex(): Promise<ContentIndexData> {
    const items = await publishedDocs();
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    return { items, pubs };
}
