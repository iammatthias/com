import type { Ctx, Route } from "./context";

/** /og/<sig>.jpg: social cards, drawn and kept by the og Worker (../og), bound as OG. */
async function og({ request, env }: Ctx): Promise<Response> {
    if (!env.OG) return new Response("No card service bound.", { status: 503, headers: { "Cache-Control": "no-store" } });
    return env.OG.fetch(request);
}

export const ogRoutes: Route[] = [
    { methods: ["GET", "HEAD"], pattern: /^\/og\/[0-9a-f]{24}\.jpg$/, handler: og },
    // after a deploy: draw any missing cards now (the og Worker checks the bearer)
    { methods: ["POST"], pattern: /^\/og\/sweep$/, handler: og },
];
