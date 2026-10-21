import puppeteer, { type Browser } from "@cloudflare/puppeteer";
import { CARD_VERSION, cardQuery, specFromQuery, verifyCard, type CardSpec } from "../../worker/src/lib/og-card";
import { drawGate } from "./draw-gate";

/**
 * Social cards for com-next. GET /og/<sig>.jpg?kind&eyebrow&title&description&seed (the site
 * Worker writes these URLs into og:image, signed, and forwards them here through its OG
 * binding): the card is drawn once by the site's card page (app/card/card.html, the plate's own
 * shaders in WebGL2) in Browser Run, then kept in KV and the edge cache under its signature.
 * A changed title or description is a new signature, so a new card; an unchanged one is never
 * drawn twice. Crawlers don't wait long: a card not yet drawn gets a short try, then the home
 * card while it finishes in the background. An hourly sweep draws every page's card ahead of
 * time, from the site's own sitemap and og:image tags.
 */

interface Env {
    BROWSER: Fetcher;
    SITE: Fetcher;
    CONTENT_CACHE: KVNamespace;
    SITE_ORIGIN: string;
    OG_SIGNING_KEY: string;
}

// JPEG: the grain is noise a PNG can barely compress (a card ran ~1 MB as PNG). Quality 72 keeps
// the grain and the type clean at a fraction of the size
const JPEG_QUALITY = 72;
const IMAGE_HEADERS = {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
    // each edge keeps its own copy (the site Worker would otherwise mark it no-store)
    "Cloudflare-CDN-Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
};
const kvKey = (sig: string) => `og:${CARD_VERSION}:${sig}`;
const FALLBACK_KEY = `og:${CARD_VERSION}:fallback`;
/** how long a crawler's request may wait on a first drawing */
const INLINE_BUDGET_MS = 9000;
/** cards one sweep draws at most (it runs hourly; a first sweep spreads over a few) */
const SWEEP_LIMIT = 40;

async function draw(browser: Browser, origin: string, spec: CardSpec): Promise<ArrayBuffer> {
    const page = await browser.newPage();
    try {
        await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
        await page.goto(`${origin}/card/card?${cardQuery(spec)}`, { waitUntil: "load", timeout: 20000 });
        await page.waitForFunction("window.__cardReady || window.__cardError", { timeout: 20000 });
        const error = await page.evaluate("window.__cardError");
        if (error) throw new Error(`card page: ${error}`);
        const card = await page.$("#card");
        if (!card) throw new Error("card page: no #card");
        const png = (await card.screenshot({ type: "jpeg", quality: JPEG_QUALITY })) as Uint8Array;
        return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    } finally {
        await page.close().catch(() => {});
    }
}

async function drawOne(env: Env, spec: CardSpec, sig: string): Promise<ArrayBuffer> {
    const browser = await puppeteer.launch(env.BROWSER);
    try {
        const png = await draw(browser, env.SITE_ORIGIN, spec);
        await env.CONTENT_CACHE.put(kvKey(sig), png);
        if (spec.kind === "home") await env.CONTENT_CACHE.put(FALLBACK_KEY, png);
        return png;
    } finally {
        await browser.close().catch(() => {});
    }
}

const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

/** The home card for now (briefly, so the real one takes over once drawn), or 503 before any card exists. */
async function fallbackResponse(request: Request, env: Env): Promise<Response> {
    const fallback = await env.CONTENT_CACHE.get(FALLBACK_KEY, "arrayBuffer");
    if (!fallback) return new Response("The card is still being drawn.", { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } });
    return new Response(request.method === "HEAD" ? null : fallback, {
        headers: { ...IMAGE_HEADERS, "Cache-Control": "public, max-age=300", "Cloudflare-CDN-Cache-Control": "public, max-age=300" },
    });
}

async function serve(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/og\/([0-9a-f]{24})\.jpg$/);
    if (!m) return new Response("Not found.", { status: 404 });
    const sig = m[1];
    const spec = specFromQuery(url.searchParams);
    if (!(await verifyCard(spec, sig, env.OG_SIGNING_KEY))) return new Response("Not found.", { status: 404 });

    // the edge first, keyed by the signed URL alone (the query is fixed by the signature)
    const cacheKey = new Request(`${url.origin}/og/${sig}.jpg`);
    const edge = await caches.default.match(cacheKey);
    if (edge) return edge;

    const kept = await env.CONTENT_CACHE.get(kvKey(sig), "arrayBuffer");
    if (kept) {
        const res = new Response(request.method === "HEAD" ? null : kept, { headers: IMAGE_HEADERS });
        ctx.waitUntil(caches.default.put(cacheKey, new Response(kept, { headers: IMAGE_HEADERS })));
        return res;
    }

    // not drawn yet, and nobody else is on it: a short try; past that, the home card now and
    // the real one shortly
    const gate = await drawGate(env.CONTENT_CACHE, sig, Date.now());
    if (gate !== "draw") {
        console.warn(`[og] ${gate}: ${sig} gets the home card`);
        return fallbackResponse(request, env);
    }
    const drawing = drawOne(env, spec, sig);
    const png = await Promise.race([drawing.catch(() => null), timeout(INLINE_BUDGET_MS)]);
    if (png) {
        ctx.waitUntil(caches.default.put(cacheKey, new Response(png, { headers: IMAGE_HEADERS })));
        return new Response(request.method === "HEAD" ? null : png, { headers: IMAGE_HEADERS });
    }
    ctx.waitUntil(drawing.catch((err) => console.error("[og] draw failed:", sig, String(err))));
    return fallbackResponse(request, env);
}

const SWEPT_KEY = `og:${CARD_VERSION}:swept`;

async function fingerprint(text: string): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
    return [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Every page's card URL, read from the site itself: its sitemap, then each page's og:image. */
async function siteCards(env: Env, sitemap: string): Promise<string[]> {
    const site = (path: string, accept: string) => env.SITE.fetch(new Request(`${env.SITE_ORIGIN}${path}`, { headers: { Accept: accept } }));
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const cards = new Set<string>();
    const queue = ["/", ...paths];
    // a few at a time: page HTML is cheap, and the site shouldn't see a burst
    for (let i = 0; i < queue.length; i += 6) {
        const batch = await Promise.all(
            queue.slice(i, i + 6).map(async (path) => {
                try {
                    const html = await (await site(path, "text/html")).text();
                    const m = html.match(/<meta property="og:image" content="([^"]+)"/);
                    return m ? m[1].replace(/&amp;/g, "&") : null;
                } catch {
                    return null;
                }
            }),
        );
        for (const c of batch) if (c && c.includes("/og/")) cards.add(c);
    }
    return [...cards];
}

/** Draw the cards not yet kept, in one browser, home first (it is everyone's fallback). */
async function sweep(env: Env, limit = SWEEP_LIMIT): Promise<{ total: number; drawn: number; failed: number; left: number; unchanged?: true }> {
    // the sitemap carries every page and its lastmod: unchanged since a complete sweep, nothing to do
    const sitemap = await (await env.SITE.fetch(new Request(`${env.SITE_ORIGIN}/sitemap.xml`, { headers: { Accept: "application/xml" } }))).text();
    const print = await fingerprint(sitemap);
    if ((await env.CONTENT_CACHE.get(SWEPT_KEY)) === print) return { total: 0, drawn: 0, failed: 0, left: 0, unchanged: true };
    const urls = (await siteCards(env, sitemap)).sort((a, b) => Number(b.includes("kind=home")) - Number(a.includes("kind=home")));
    const missing: Array<{ sig: string; spec: CardSpec }> = [];
    for (const u of urls) {
        const url = new URL(u);
        const sig = url.pathname.match(/([0-9a-f]{24})\.jpg$/)?.[1];
        if (!sig) continue;
        const spec = specFromQuery(url.searchParams);
        if (!(await verifyCard(spec, sig, env.OG_SIGNING_KEY))) continue;
        if ((await env.CONTENT_CACHE.get(kvKey(sig), "stream")) === null) missing.push({ sig, spec });
    }
    let drawn = 0, failed = 0;
    if (missing.length) {
        const browser = await puppeteer.launch(env.BROWSER);
        try {
            for (const { sig, spec } of missing.slice(0, limit)) {
                try {
                    const png = await draw(browser, env.SITE_ORIGIN, spec);
                    await env.CONTENT_CACHE.put(kvKey(sig), png);
                    if (spec.kind === "home") await env.CONTENT_CACHE.put(FALLBACK_KEY, png);
                    drawn++;
                } catch (err) {
                    failed++;
                    console.error("[og] sweep draw failed:", sig, String(err));
                }
            }
        } finally {
            await browser.close().catch(() => {});
        }
    }
    const left = Math.max(missing.length - limit, 0);
    if (left === 0 && failed === 0) await env.CONTENT_CACHE.put(SWEPT_KEY, print);
    return { total: urls.length, drawn, failed, left };
}

function authorized(request: Request, env: Env): boolean {
    const given = request.headers.get("Authorization") ?? "";
    const want = `Bearer ${env.OG_SIGNING_KEY}`;
    if (given.length !== want.length) return false;
    let diff = 0;
    for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ given.charCodeAt(i);
    return diff === 0;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        // POST /og/sweep (bearer: the signing key): draw what's missing now, e.g. after a deploy.
        // A few at a time (?limit=, default 6): a response has to come back within ~100 s, so a
        // caller loops until `left` is 0; the hourly cron draws more per run
        if (url.pathname === "/og/sweep" && request.method === "POST") {
            if (!authorized(request, env)) return new Response("Unauthorized.", { status: 401 });
            const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 6, 1), 12);
            return Response.json(await sweep(env, limit));
        }
        if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
        try {
            return await serve(request, env, ctx);
        } catch (err) {
            console.error("[og] unhandled:", String(err));
            return new Response("The card couldn't be drawn.", { status: 500, headers: { "Cache-Control": "no-store" } });
        }
    },
    async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(sweep(env).then((r) => console.log("[og] sweep", JSON.stringify(r))));
    },
} satisfies ExportedHandler<Env>;
