// /llms.txt — the machine-readable map of the site (llmstxt.org).
// Built from the same live collections the pages render from, so it
// never drifts from published content. Every content link points at
// the markdown twin (`<path>.md`); the twin's front matter carries
// the canonical HTML URL. Discovery: HTML/markdown responses carry a
// `Link: </llms.txt>; rel="describedby"` header (middleware + the
// static _headers file).

export const prerender = false;

import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { setResponseCacheHeaders } from "@lib/cache";
import { headFromGet } from "@lib/http";
import {
    entriesOf,
    type DocumentData,
    type PublicationData,
} from "@lib/farfield-loader";

export const GET: APIRoute = async (context) => {
    const origin = (
        context.site?.toString() ?? "https://iammatthias.com"
    ).replace(/\/$/, "");

    const [docsResult, pubsResult] = await Promise.all([
        getLiveCollection("documents"),
        getLiveCollection("publications"),
    ]);
    for (const [label, r] of [
        ["documents", docsResult],
        ["publications", pubsResult],
    ] as const) {
        if (r.error) {
            console.error(`[/llms.txt] Farfield ${label} fetch failed:`, r.error);
        }
    }
    const docs = entriesOf<DocumentData>(docsResult.entries);
    const pubs = entriesOf<PublicationData>(pubsResult.entries);

    const sections = pubs
        .map((pub) => {
            const items = docs.filter((d) => d.collection === pub.slug);
            if (items.length === 0) return "";
            const lines = [`## ${pub.name}`, ""];
            if (pub.description) lines.push(`> ${pub.description}`, "");
            for (const d of items) {
                const line = `- [${d.title}](${origin}${d.href}.md)`;
                lines.push(d.description ? `${line}: ${d.description}` : line);
            }
            return lines.join("\n");
        })
        .filter(Boolean);

    const body = `# iammatthias

> Matthias Jordan's cozy corner of the web. Photographs, projects, recipes, and notes, open and personal.

Every content URL on this site has a markdown twin: append \`.md\` to the path (\`/posts/<slug>\` → \`/posts/<slug>.md\`; section indexes at \`/<section>.md\`). Requests sent with an \`Accept: text/markdown\` header receive the markdown twin at the canonical URL. The whole corpus in one file: [llms-full.txt](${origin}/llms-full.txt).

${sections.join("\n\n")}

## Feed

- [Feed](${origin}/feed.md): short posts, newest first; each at /feed/<id>.md

## Optional

- [Now](${origin}/now): what Matthias is up to lately
- [Resume](${origin}/resume)
- [RSS](${origin}/rss.xml): sitewide feed; per-section feeds at /<section>/rss.xml
- [Sitemap](${origin}/sitemap.xml)
`;

    const response = new Response(body, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
    setResponseCacheHeaders(response, docsResult.cacheHint, {
        extraTags: pubsResult.cacheHint?.tags,
    });
    return response;
};

export const HEAD = headFromGet(GET);
