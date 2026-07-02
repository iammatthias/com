// Shared data loading for the all-content index. `/content` (page 1,
// content/index.astro) and `/content/page/N` (content/page/[page].astro)
// are separate routes for legacy-redirect reasons but need identical
// fetch + error handling — this keeps that logic in one place.

import { getLiveCollection } from "astro:content";
import {
    entriesOf,
    type DocumentData,
    type PublicationData,
} from "./farfield-loader";
import type { CacheHintLike } from "./cache";

export interface ContentIndexData {
    items: DocumentData[];
    pubs: PublicationData[];
    /** Documents loader hint — becomes the response cache headers. */
    cacheHint?: CacheHintLike;
    /** Publications loader tags, merged in via `extraTags`. */
    extraTags?: string[];
}

export async function loadContentIndex(
    preview: boolean,
): Promise<ContentIndexData> {
    const [docsResult, pubsResult] = await Promise.all([
        getLiveCollection("documents", { preview }),
        getLiveCollection("publications"),
    ]);
    if (docsResult.error) {
        console.error(
            "[/content] Farfield documents fetch failed:",
            docsResult.error,
        );
    }
    if (pubsResult.error) {
        console.error(
            "[/content] Farfield publications fetch failed:",
            pubsResult.error,
        );
    }
    return {
        items: docsResult.error
            ? []
            : entriesOf<DocumentData>(docsResult.entries),
        pubs: pubsResult.error
            ? []
            : entriesOf<PublicationData>(pubsResult.entries),
        cacheHint: docsResult.cacheHint,
        extraTags: pubsResult.cacheHint?.tags,
    };
}
