// /llms-full.txt — the whole document corpus in one markdown file
// (the llms.txt convention's companion). Prerendered: each entry is
// the same output as its `<path>.md` twin, front matter included. The
// feed (short posts) is deliberately left out — it's ephemera, and it
// lives at /feed.md.

export const prerender = true;

import type { APIRoute } from "astro";
import { mapWithConcurrency } from "@lib/http";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import { publishedDocs } from "@lib/content-query";

export const GET: APIRoute = async ({ site }) => {
    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    const docs = await publishedDocs();

    const rendered = await mapWithConcurrency(docs, 8, async (doc) => {
        const bodyMd = await resolveEmbedsForMarkdown(doc.body);
        return composeDocumentMarkdown(doc, bodyMd, origin);
    });

    const header = `# iammatthias — full content

> Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.

Every published entry, newest first. Each entry's front matter carries its canonical \`html:\` URL; the per-entry markdown twin lives at that URL plus \`.md\`. The site map is at /llms.txt; short posts live separately at /feed.md.
`;

    return new Response([header, ...rendered].join("\n"), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
};
