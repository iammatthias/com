// /developers/llms.txt — scoped context for the developer surface,
// which is the section an agent looking for API docs probes by name.

export const prerender = true;

import type { APIRoute } from "astro";
import { developersMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async () =>
    markdownResponse(await developersMarkdown());
