
export const prerender = false;

import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "@lib/agent-surface";
import { sectionForRoute } from "@lib/content-query";
import { markdownResponse } from "@lib/agent-http";
import { setDocumentPageCacheHeaders } from "@lib/cache";

export const GET: APIRoute = async ({ params }) => {
    const section = await sectionForRoute(params.publication);
    if (!section) return new Response(null, { status: 404 });
    const { pub, items } = section;
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
    const response = markdownResponse(body, 300);
    setDocumentPageCacheHeaders(response);
    return response;
};
