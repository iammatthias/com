export const prerender = false;

import type { APIRoute } from "astro";
import { readSecret } from "@lib/farfield";
import { bearerMatches, parseContentEvents, tagsFor } from "@lib/revalidate";
import { purgeTags } from "@lib/edge-purge";

const NO_STORE = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function reply(status: number, body: unknown, extra: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, ...extra } });
}

export const POST: APIRoute = async ({ request, locals }) => {
    if (!bearerMatches(request.headers.get("authorization"), readSecret("CONTENT_READ_KEY"))) {
        return reply(401, { error: "unauthorized" });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return reply(400, { error: "body must be JSON" });
    }
    const events = parseContentEvents(body);
    if (!events) {
        return reply(400, {
            error: 'expected {"kind": "entry" | "series" | "collection" | "post", "slug"?: string}, or an array of up to 50',
        });
    }
    const tags = tagsFor(events);
    const result = await purgeTags(tags, (locals as { cfContext?: unknown }).cfContext);
    if (!result.success) {
        return reply(503, { error: "purge failed", tags, errors: result.errors ?? [] }, { "Retry-After": "15" });
    }
    return reply(200, { purged: tags });
};
