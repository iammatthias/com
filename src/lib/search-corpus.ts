
import { plainText } from "@lib/markdown-text";
import type { DocumentData, FeedEntryData } from "@lib/farfield-loader";

export { SEARCH_DIMS, SEARCH_MODEL } from "@lib/search-model";

export interface SearchCorpusItem {
    href: string;
    title: string;
    kind: string;
    cid: string;
    text: string;
}

function docText(d: DocumentData): string {
    const lead = plainText(d.body).slice(0, 600);
    return [d.title, d.description, lead].filter(Boolean).join(" — ");
}

export function buildSearchCorpus(
    docs: DocumentData[],
    feed: FeedEntryData[],
): SearchCorpusItem[] {
    return [
        ...docs.map((d) => ({
            href: d.href,
            title: d.title,
            kind: d.publication.name.toLowerCase(),
            cid: d.cid,
            text: docText(d),
        })),
        ...feed.map((f) => {
            const text = plainText(f.body);
            return {
                href: `/feed/${f.rkey}`,
                title: text.slice(0, 80) || `Feed entry ${f.rkey}`,
                kind: "feed",
                cid: f.cid,
                text: text.slice(0, 600),
            };
        }),
    ];
}
