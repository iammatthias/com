// /developers.md — the markdown twin of the developer page.

export const prerender = true;

import type { APIRoute } from "astro";
import { developersMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async () =>
    markdownResponse(await developersMarkdown());
