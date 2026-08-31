
export const prerender = true;

import type { APIRoute } from "astro";
import { printSchema } from "graphql";
import { schema } from "@lib/graphql-schema";

export const GET: APIRoute = () =>
    new Response(printSchema(schema), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
