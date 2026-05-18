// Live content collections backed by the Farfield API.
//
// Astro's Live Loader API runs at request time (not build time), so new
// posts on Farfield surface on the site without a rebuild. The loaders
// themselves dedupe upstream fetches via a per-isolate TTL cache, and
// pages translate the returned `cacheHint` into HTTP cache headers so
// the rendered HTML caches at the edge.
//
// Consumers:
//   - getLiveCollection('publications')                — for menus + lists
//   - getLiveEntry('publications', slug)               — for /[publication]
//   - getLiveCollection('documents', { publication })  — for pub indexes
//   - getLiveCollection('documents', { tag })          — for tag indexes
//   - getLiveEntry('documents', { publication, slug }) — for doc detail
//   - getLiveCollection('feedEntries')                 — for /feed + /now
//   - getLiveEntry('feedEntries', rkey)                — for /feed/[rkey]

import { defineLiveCollection } from "astro:content";
import {
    documentsLoader,
    feedEntriesLoader,
    publicationsLoader,
} from "./lib/farfield-loader";

const publications = defineLiveCollection({
    loader: publicationsLoader(),
});

const documents = defineLiveCollection({
    loader: documentsLoader(),
});

const feedEntries = defineLiveCollection({
    loader: feedEntriesLoader(),
});

export const collections = { publications, documents, feedEntries };
