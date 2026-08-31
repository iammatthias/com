
export const prerender = true;

import type { APIRoute } from "astro";
import { siteOrigin, headFromGet } from "@lib/http";
import {
    AGENT_CRAWLERS,
    CONTENT_SIGNAL,
    SEARCH_ONLY_CRAWLERS,
} from "@lib/agent-surface";

const ALLOWED = [...AGENT_CRAWLERS, ...SEARCH_ONLY_CRAWLERS];

const DISALLOWED = ["CCBot", "ByteSpider", "Bytespider", "Omgilibot", "Diffbot"];

export const GET: APIRoute = ({ site }) => {
    const origin = siteOrigin(site);

    const body = [
        "# Everything published here is meant to be read, by people and agents alike.",
        "# Machine-readable entry points: /llms.txt, /llms-full.txt, /openapi.json, /mcp",
        "",
        "User-agent: *",
        "Allow: /",
        "",
        "# Content-Signal: search and AI answers welcome (they cite and send readers);",
        "# bulk training on the photography archive is not.",
        `Content-Signal: ${CONTENT_SIGNAL}`,
        "",
        ...ALLOWED.flatMap((ua) => [`User-agent: ${ua}`, "Allow: /", ""]),
        "# Training-only crawlers.",
        ...DISALLOWED.flatMap((ua) => [`User-agent: ${ua}`, "Disallow: /", ""]),
        `Sitemap: ${origin}/sitemap.xml`,
        "",
    ].join("\n");

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};

export const HEAD = headFromGet(GET);
