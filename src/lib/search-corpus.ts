// Shared shape + builder for the semantic search corpus. Two endpoints
// consume this: /api/search-corpus.json (SSR — always fresh) and
// /api/search-vectors.json (prerendered — embeds every item at build
// time so browsers never pay the ~55 ms/item corpus embedding cost).
// Sharing the text construction is what keeps the build-time vectors
// valid for the runtime corpus: same cid + same text → same vector.

import { plainText } from "@lib/markdown-text";
import type { DocumentData, FeedEntryData } from "@lib/farfield-loader";

export { SEARCH_DIMS, SEARCH_MODEL } from "@lib/search-model";

export interface SearchCorpusItem {
    href: string;
    title: string;
    /** Kicker shown in results — publication name or "feed". */
    kind: string;
    /** Content hash — vector cache key everywhere. */
    cid: string;
    /** What actually gets embedded (~95 words max is useful). */
    text: string;
}

/** Title + description + lead of the body, trimmed near the model's
 *  input window so we don't ship text the embedding can't see. */
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
