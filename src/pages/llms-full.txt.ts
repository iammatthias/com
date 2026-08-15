// /llms-full.txt — the whole document corpus in one markdown file
// (the llms.txt convention's companion). Each entry is the same
// output as its `<path>.md` twin, front matter included, so an agent
// can ingest the site in a single fetch. The feed (short posts) is
// deliberately left out — it's ephemera, and it lives at /feed.md.
//
// Per-entry body resolution is cid-cached (lib/render-cache), so a
// warm render of this file is list-fetch + N KV reads, no upstream
// series calls. Cached a little longer than pages — it only changes
// when content publishes.

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet, mapWithConcurrency } from "@lib/http";
import { cachedRender } from "@lib/render-cache";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import { entriesOf, type DocumentData } from "@lib/farfield-loader";

export const GET: APIRoute = async (context) => {
    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const { entries, error, cacheHint } =
        await getLiveCollection("documents");
    if (error) {
        console.error("[/llms-full.txt] Farfield fetch failed:", error);
        return new Response(null, { status: 502 });
    }
    const docs = entriesOf<DocumentData>(entries);

    // Bounded concurrency: on a cold cache (fresh RENDER_VERSION) every
    // doc resolves its series upstream, and an unbounded Promise.all
    // storm would contend for workerd's per-host connection budget.
    const rendered = await mapWithConcurrency(docs, 8, async (doc) => {
        const bodyMd = await cachedRender("mdbody", doc.cid, () =>
            resolveEmbedsForMarkdown(doc.body),
        );
        return composeDocumentMarkdown(doc, bodyMd, origin);
    });

    const header = `# iammatthias — full content

> Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.

Every published entry, newest first. Each entry's front matter carries its canonical \`html:\` URL; the per-entry markdown twin lives at that URL plus \`.md\`. The site map is at /llms.txt; short posts live separately at /feed.md.
`;

    const response = new Response([header, ...rendered].join("\n"), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
    setResponseCacheHeaders(response, cacheHint, {
        maxAge: 300,
        swr: 600,
    });
    return response;
};

export const HEAD = headFromGet(GET);
