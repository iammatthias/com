export interface Env {
    ASSETS: Fetcher;
    /** the og Worker (../og): social cards at /og/<sig>.png */
    OG?: Fetcher;
    /** signs card URLs (lib/og-card.ts); the og Worker holds the same key */
    OG_SIGNING_KEY?: string;
    CONTENT_CACHE?: KVNamespace;
    CONTENT_READ_KEY?: string;
    CONTENT_API_KEY?: string;
    FEED_READ_KEY?: string;
    BLOBS_READ_KEY?: string;
}

export interface Ctx {
    request: Request;
    url: URL;
    env: Env;
    exec: ExecutionContext;
    /** Capture groups of the matched route pattern, URI-decoded. */
    params: string[];
}

export type Handler = (ctx: Ctx) => Promise<Response | null> | Response | null;

export interface Route {
    methods: string[];
    pattern: RegExp;
    handler: Handler;
}

export const notFound = (): Response => new Response(null, { status: 404 });
