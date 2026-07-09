// Prebuilt embedding vectors for the semantic menu search.
//
// Prerendered: this runs once at build time (in node, via
// prerenderEnvironment) and ships as a static JSON file. Embedding is
// the expensive half of warming search — ~55 ms per item, several
// seconds for the whole corpus — so doing it here means a first-visit
// browser only ever embeds the query it types, not the corpus.
//
// Vectors are keyed by Farfield cid. The corpus itself stays live
// (/api/search-corpus.json), so content published after this build
// simply misses from this file and the search worker embeds those few
// items client-side — the file is an accelerator, never a gate.
//
// The ternlight import is dynamic with @vite-ignore so node resolves
// the package (and its .wasm, loaded relative to the real module path)
// from node_modules at build time instead of Vite bundling it into the
// server output — the 10 MB engine must never reach the worker bundle.

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
        // A build without Farfield keys (or with the engine missing)
        // still succeeds — the file ships empty and browsers fall back
        // to embedding the corpus themselves, exactly as before.
        console.error("[/api/search-vectors] prebuild failed:", err);
    }
    return new Response(
        JSON.stringify({ model: SEARCH_MODEL, dims: SEARCH_DIMS, vectors }),
        { headers: { "Content-Type": "application/json" } },
    );
};
