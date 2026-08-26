// Catch-all for unknown /api/* paths. Without this an agent hitting a
// mistyped endpoint gets the site's HTML 404 page, which it cannot
// parse — the whole point of publishing an API is that failures are
// machine-readable too.

export const prerender = false;

import type { APIRoute } from "astro";
import { jsonError } from "@lib/agent-http";
import { API_OPERATIONS, SITE_ORIGIN } from "@lib/agent-surface";

const problem = (path: string) =>
    jsonError(
        404,
        "endpoint_not_found",
        `No API endpoint at /api/${path}.`,
        `Known endpoints: ${API_OPERATIONS.map((o) => o.path).join(", ")}. Full specification at ${SITE_ORIGIN}/openapi.json.`,
    );

export const GET: APIRoute = ({ params }) => problem(params.missing ?? "");
export const HEAD: APIRoute = ({ params }) => problem(params.missing ?? "");
export const POST: APIRoute = ({ params }) => problem(params.missing ?? "");
export const PUT: APIRoute = ({ params }) => problem(params.missing ?? "");
export const PATCH: APIRoute = ({ params }) => problem(params.missing ?? "");
export const DELETE: APIRoute = ({ params }) => problem(params.missing ?? "");
