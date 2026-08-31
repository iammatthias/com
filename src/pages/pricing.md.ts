
export const prerender = true;

import type { APIRoute } from "astro";
import { pricingMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = () =>
    markdownResponse(pricingMarkdown());
