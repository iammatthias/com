// /pricing.md — machine-readable "it's free", so an agent comparing
// options doesn't have to infer it from the absence of a pricing page.

export const prerender = true;

import type { APIRoute } from "astro";
import { pricingMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = () =>
    markdownResponse(pricingMarkdown());
