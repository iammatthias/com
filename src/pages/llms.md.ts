// /llms.md — the well-known root markdown path agents probe when they
// arrive cold. Same body as /index.md.

export const prerender = true;

import type { APIRoute } from "astro";
import { homepageMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = async () =>
    markdownResponse(await homepageMarkdown(), 300);
