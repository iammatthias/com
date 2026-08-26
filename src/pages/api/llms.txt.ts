// /api/llms.txt — scoped context under the section name agents
// probe when looking for API and reference material. Same content as
// /developers/llms.txt; the site has one developer surface, and
// meeting a probe at its expected address costs nothing.

export const prerender = true;

import type { APIRoute } from "astro";
import { developersMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async () =>
    markdownResponse(await developersMarkdown());
