
import { livePublications, type DocumentData, type PublicationData } from "./farfield-loader";
import { publishedDocs } from "./content-query";

export interface ContentIndexData {
    items: DocumentData[];
    pubs: PublicationData[];
}

export async function loadContentIndex(): Promise<ContentIndexData> {
    const items = await publishedDocs();
    const pubs = await livePublications();
    return { items, pubs };
}
