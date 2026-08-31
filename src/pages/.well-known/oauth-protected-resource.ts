
export const prerender = true;

import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "@lib/agent-surface";

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify(
            {
                resource: SITE_ORIGIN,
                authorization_servers: [],
                scopes_supported: [],
                bearer_methods_supported: [],
                resource_documentation: `${SITE_ORIGIN}/auth.md`,
                resource_policy_uri: `${SITE_ORIGIN}/privacy`,
                resource_name: "iammatthias.com public content",
                authentication_required: false,
            },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        },
    );
