// Build-time content collections (Content Layer) — the static half.
//
// `docs` / `pubs` / `posts` are synced from Farfield at build time by
// the loaders in lib/farfield-content-loader.ts, each entry carrying
// `digest: cid` so the incremental build can skip unchanged pages.
// The live collections (documents / publications / feedEntries in
// live.config.ts) remain the runtime data source for the SSR
// surfaces; the two sets deliberately use different names.

import { defineCollection } from "astro:content";
import {
    farfieldDocsLoader,
    farfieldPubsLoader,
    farfieldPostsLoader,
} from "./lib/farfield-content-loader";

const docs = defineCollection({ loader: farfieldDocsLoader() });
const pubs = defineCollection({ loader: farfieldPubsLoader() });
const posts = defineCollection({ loader: farfieldPostsLoader() });

export const collections = { docs, pubs, posts };
