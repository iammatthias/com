import type { APIRoute } from "astro";
import { glassPick } from "@lib/glass";
import { headFromGet } from "@lib/http";

export const prerender = false;

export const GET: APIRoute = async () => {
    const pick = await glassPick();
    if (!pick) {
        return new Response(null, {
            status: 204,
            headers: { "Cache-Control": "no-store" },
        });
    }
    return new Response(JSON.stringify(pick), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control":
                "public, s-maxage=15, stale-while-revalidate=60",
        },
    });
};

export const HEAD = headFromGet(GET);
