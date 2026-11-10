
import { bodyText, snippet, summarize } from "./summary";
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
    const lead = summarize(d, "searchText");
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
            const text = bodyText(f);
            // a note that is only pictures has no words to find it by; the empty string embeds
            // to one vector that lands near every query
            if (!text) return [];
            return {
                href: `/feed/${f.rkey}`,
                title: snippet(text, "searchTitle"),
                kind: "feed",
                cid: f.cid,
                text: snippet(text, "searchText"),
            };
        }),
    ];
}
