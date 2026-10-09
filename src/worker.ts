import { WorkerEntrypoint } from "cloudflare:workers";
import { handle } from "@astrojs/cloudflare/handler";
import { EDGE_CACHE_HEADER } from "./lib/cache";
import {
    representationFor,
    restoreNegotiatedVary,
    shelveNegotiatedVary,
    type SiteProps,
} from "./lib/negotiate";

export class Site extends WorkerEntrypoint<Record<string, unknown>, SiteProps> {
    async fetch(request: Request): Promise<Response> {
        const rendered = await handle(request, this.env, this.ctx);
        const response = new Response(rendered.body, rendered);
        if (!response.headers.has(EDGE_CACHE_HEADER)) {
            response.headers.set(EDGE_CACHE_HEADER, "no-store");
        }
        shelveNegotiatedVary(response.headers);
        return response;
    }
}

export default {
    async fetch(
        request: Request,
        _env: unknown,
        ctx: { exports: { Site: { fetch(r: Request, init: { props: SiteProps }): Promise<Response> } } },
    ): Promise<Response> {
        const cached = await ctx.exports.Site.fetch(request, {
            props: { representation: representationFor(request) },
        });
        const response = new Response(cached.body, cached);
        restoreNegotiatedVary(response.headers);
        return response;
    },
};
