
export const prerender = true;

import type { APIRoute } from "astro";
import { siteOrigin, mapWithConcurrency } from "@lib/http";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import { publishedDocs } from "@lib/content-query";
import { SITE_IDENTITY } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async ({ site }) => {
    const origin = siteOrigin(site);

    const docs = await publishedDocs();

    const rendered = await mapWithConcurrency(docs, 8, async (doc) => {
        const bodyMd = await resolveEmbedsForMarkdown(doc.body);
        return composeDocumentMarkdown(doc, bodyMd, origin);
    });

    const header = `# iammatthias — full content

> ${SITE_IDENTITY.tagline}

Every published entry, newest first. Each entry's front matter carries its canonical \`html:\` URL; the per-entry markdown twin lives at that URL plus \`.md\`. The site map is at /llms.txt; short posts live separately at /feed.md.
`;

    return markdownResponse([header, ...rendered].join("\n"));
};
