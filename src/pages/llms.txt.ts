// /llms.txt — the machine-readable map of the site (llmstxt.org).
// Prerendered from the build-time collections; the publish hook keeps
// it in step with content. Every content link points at the markdown
// twin (`<path>.md`); the twin's front matter carries the canonical
// HTML URL. Discovery: HTML/markdown responses carry a
// `Link: </llms.txt>; rel="describedby"` header (middleware + the
// static _headers file).

export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "@lib/farfield-loader";

export const GET: APIRoute = async ({ site }) => {
    const origin = (site?.toString() ?? "https://iammatthias.com").replace(
        /\/$/,
        "",
    );

    const docs = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );

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

Every content URL on this site has a markdown twin: append \`.md\` to the path (\`/posts/<slug>\` → \`/posts/<slug>.md\`; section indexes at \`/<section>.md\`). The whole corpus in one file: [llms-full.txt](${origin}/llms-full.txt).

${sections.join("\n\n")}

## Feed

- [Feed](${origin}/feed.md): short posts, newest first; each at /feed/<id>.md

## Optional

- [Now](${origin}/now): what Matthias is up to lately
- [Resume](${origin}/resume)
- [RSS](${origin}/rss.xml): sitewide feed; per-section feeds at /<section>/rss.xml
- [Sitemap](${origin}/sitemap.xml)
`;

    return new Response(body, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
};
