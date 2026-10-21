
import { plainText } from "./markdown-text";
import type { DocumentData, FeedEntryData } from "./farfield-loader";

export { SEARCH_DIMS, SEARCH_MODEL } from "./search-model";

interface SearchCorpusItem {
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
        ...feed.flatMap((f) => {
            const text = plainText(f.body);
            // a note that is only pictures has no words to find it by; the empty string embeds
            // to one vector that lands near every query
            if (!text) return [];
            return {
                href: `/feed/${f.rkey}`,
                title: text.slice(0, 80),
                kind: "feed",
                cid: f.cid,
                text: text.slice(0, 600),
            };
        }),
    ];
}
