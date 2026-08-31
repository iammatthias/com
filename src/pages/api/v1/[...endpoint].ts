
export const prerender = false;

import type { APIRoute } from "astro";
import { GET as searchGet } from "../search.json";
import { GET as contentGet } from "../content.json";
import { jsonError } from "@lib/agent-http";
import { API_OPERATIONS, SITE_ORIGIN } from "@lib/agent-surface";

const HANDLERS: Record<string, APIRoute> = {
    "search.json": searchGet,
    "content.json": contentGet,
};

export const GET: APIRoute = async (context) => {
    const endpoint = (context.params.endpoint ?? "").replace(/^\/+/, "");
    const handler = HANDLERS[endpoint];
    if (!handler) {
        return jsonError(
            404,
            "endpoint_not_found",
            `No v1 endpoint at /api/v1/${endpoint}.`,
            `v1 serves: ${Object.keys(HANDLERS).join(", ")}. Static datasets stay unversioned at ${API_OPERATIONS.map((o) => o.path).join(", ")}. Specification: ${SITE_ORIGIN}/openapi.json.`,
        );
    }
    return handler(context) as Promise<Response>;
};
