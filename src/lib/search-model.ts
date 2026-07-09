// Embedding-model identity for the semantic menu search. Lives alone,
// dependency-free, because the search worker bundles it for the
// browser — importing it from search-corpus.ts (whose markdown helpers
// reach astro:env) would drag server-only modules into the worker.

/** Identifies the embedding model a vector was produced by. Bump when
 *  swapping ternlight tiers/versions — stale vectors (prebuilt file or
 *  IndexedDB cache) are discarded on mismatch. */
export const SEARCH_MODEL = "@ternlight/base@0.1";
export const SEARCH_DIMS = 384;
