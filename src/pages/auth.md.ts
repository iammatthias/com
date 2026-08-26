// /auth.md — how agents authenticate here (they don't). Structured
// per the WorkOS auth.md spec so the sections agents look for exist,
// with honest "not applicable" answers rather than invented flows.

export const prerender = true;

import type { APIRoute } from "astro";
import { authMarkdown } from "@lib/agent-markdown";
import { markdownResponse } from "@lib/agent-http";

export const GET: APIRoute = () =>
    markdownResponse(authMarkdown());
