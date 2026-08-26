// Markdown twin of the homepage — the canonical markdown entry point
// for an agent that lands at the root from search without reading
// llms.txt first. Also served at /llms.md (same body, different
// well-known name).

export const prerender = true;

import type { APIRoute } from "astro";
import { homepageMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async () =>
    markdownResponse(await homepageMarkdown(), 300);
