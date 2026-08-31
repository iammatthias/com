import type { APIRoute } from "astro";
import {
    loadAllDocuments,
    loadAllFeedEntries,
} from "@lib/farfield-loader";
import {
    buildSearchCorpus,
    SEARCH_DIMS,
    SEARCH_MODEL,
} from "@lib/search-corpus";

export const prerender = true;

export const GET: APIRoute = async () => {
    const vectors: Record<string, string> = {};
    if (import.meta.env.DEV) {
        return new Response(
            JSON.stringify({ model: SEARCH_MODEL, dims: SEARCH_DIMS, vectors }),
            { headers: { "Content-Type": "application/json" } },
        );
    }
    try {
        const [docs, feed, { embed }] = await Promise.all([
            loadAllDocuments(),
            loadAllFeedEntries(),
            import(/* @vite-ignore */ "@ternlight/base"),
        ]);
        for (const item of buildSearchCorpus(docs, feed)) {
            const v = embed(item.text);
            vectors[item.cid] = Buffer.from(
                v.buffer,
                v.byteOffset,
                v.byteLength,
            ).toString("base64");
        }
    } catch (err) {
        console.error("[/api/search-vectors] prebuild failed:", err);
    }
    return new Response(
        JSON.stringify({ model: SEARCH_MODEL, dims: SEARCH_DIMS, vectors }),
        { headers: { "Content-Type": "application/json" } },
    );
};
