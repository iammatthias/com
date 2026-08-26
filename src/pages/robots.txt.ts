// robots.txt — open to answer engines, closed to bulk training
// scrapers, with the machine-readable indexes advertised up front.
//
// The tiering is deliberate: crawlers that feed answer engines (and
// therefore send readers back, and cite) get everything; crawlers that
// exist to build training corpora out of a photography archive do not.
// Content-Signal states the same policy in the newer declarative form
// for crawlers that read it.

export const prerender = true;

import type { APIRoute } from "astro";
import { siteOrigin, headFromGet } from "@lib/http";
import {
    AGENT_CRAWLERS,
    CONTENT_SIGNAL,
    SEARCH_ONLY_CRAWLERS,
} from "@lib/agent-surface";

/** Answer-engine and agent crawlers — explicitly welcome. */
const ALLOWED = [...AGENT_CRAWLERS, ...SEARCH_ONLY_CRAWLERS];

/** Bulk training-corpus scrapers — declined. */
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
