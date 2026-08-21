// Per-section llms.txt — scoped context for one publication, so an
// agent interested in only recipes (or only art) can fetch that
// section's index without pulling the whole manual.

export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "@lib/farfield-loader";
import { SITE_ORIGIN } from "@lib/agent-surface";

export const getStaticPaths: GetStaticPaths = async () => {
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const docs = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter((d) => d.published !== false)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return pubs.map((pub) => {
        const items = docs.filter((d) => d.collection === pub.slug);
        return {
            params: { publication: pub.slug },
            props: { pub, items },
            cacheKey: items.map((d) => d.cid).join(","),
        };
    });
};

export const GET: APIRoute = ({ props }) => {
    const pub = props.pub as PublicationData;
    const items = props.items as DocumentData[];
    const body = `# ${pub.name}

> ${pub.description ?? `The ${pub.name.toLowerCase()} section of iammatthias.com.`}

${items.length} ${items.length === 1 ? "entry" : "entries"}, newest first. Each link is the entry's markdown twin; drop the \`.md\` for the HTML page. Section index: ${SITE_ORIGIN}/${pub.slug}.md · Feed: ${SITE_ORIGIN}/${pub.slug}/rss.xml

## Entries

${items
    .map(
        (d) =>
            `- ${d.publishedAt.slice(0, 10)} [${d.title}](${SITE_ORIGIN}${d.href}.md)${d.description ? `: ${d.description}` : ""}`,
    )
    .join("\n")}

## Elsewhere

- Whole site: ${SITE_ORIGIN}/llms.txt
- Whole corpus in one file: ${SITE_ORIGIN}/llms-full.txt
- Search and MCP: ${SITE_ORIGIN}/developers.md
`;
    return new Response(body, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            Vary: "Accept",
        },
    });
};
