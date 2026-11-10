import type { Ctx, Route } from "./context";

async function og({ request, env }: Ctx): Promise<Response> {
    if (!env.OG) return new Response("No card service bound.", { status: 503, headers: { "Cache-Control": "no-store" } });
    return env.OG.fetch(request);
}

export const ogRoutes: Route[] = [
    { methods: ["GET", "HEAD"], pattern: /^\/og\/[0-9a-f]{24}\.jpg$/, handler: og },
    { methods: ["POST"], pattern: /^\/og\/sweep$/, handler: og },
];
