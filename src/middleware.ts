// Trailing-slash normalization, markdown content negotiation, and
// security headers for on-demand routes.
//
// One URL form site-wide: no trailing slash. `/now/` and `/now` used to
// both render 200 with different rel=canonical values (canonical is
// derived from the request pathname) — classic duplicate-content
// signal. The 301 collapses every slashed request onto the canonical
// form. Prerendered pages are covered by `build.format: 'file'` +
// Cloudflare's asset handling instead (this middleware never sees
// them at runtime).
//
// Security headers live here for SSR responses because Cloudflare's
// `_headers` file only applies to static assets — the worker's own
// responses bypass it. public/_headers carries the same set for the
// prerendered/static half.

import { defineMiddleware } from "astro:middleware";
import { publicationSlugSet } from "@lib/farfield-loader";
import { homepageMarkdown } from "@lib/agent-markdown";
import { notFoundMarkdown } from "@lib/agent-markdown";
import { AGENT_CRAWLERS } from "@lib/agent-surface";

/**
 * Content-Security-Policy — keep in sync with the copy in
 * public/_headers (static/prerendered pages don't pass through this
 * middleware). The allowances, each load-bearing:
 *
 *   script-src  'unsafe-inline' — Astro island/inline module scripts
 *               carry no nonces; 'wasm-unsafe-eval' — the ternlight
 *               search engine compiles wasm in the search worker.
 *   style-src   'unsafe-inline' — dominantColor placeholder fills and
 *               other style="" attributes on rendered media.
 *   img-src     wsrv.nl (image CDN), blobs.farfield.systems (media
 *               service), data: (inline glyphs/favicons).
 *   media-src   blobs.farfield.systems — video/audio blob streaming.
 *   connect-src sepolia.base.org — viem's default Base Sepolia RPC
 *               for the onchain-analytics island.
 *
 * Applied in prod only: vite dev injects HMR machinery this policy
 * would strangle, and dev needs no CSP.
 */
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://wsrv.nl https://blobs.farfield.systems",
    "media-src 'self' https://blobs.farfield.systems",
    "connect-src 'self' https://sepolia.base.org",
    "font-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    // One year + preload, matching public/_headers. The zone-level
    // header carries `preload` with only 180 days, which the HSTS
    // preload list rejects — the zone setting should be bumped to a
    // year too (dashboard: SSL/TLS → Edge Certificates → HSTS).
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    ...(import.meta.env.PROD ? { "Content-Security-Policy": CSP } : {}),
};

// RFC 8288 Link header advertising the machine-readable surfaces, so
// an agent learns them from whatever page it lands on. Keep in sync
// with the `/*` block in public/_headers — that file covers static
// assets, this covers the worker's own responses, and a scanner that
// hits an SSR route must see the same set.
const AGENT_LINKS = [
    '</llms.txt>; rel="describedby"; type="text/markdown"',
    '</index.md>; rel="alternate"; type="text/markdown"',
    '</sitemap.xml>; rel="sitemap"; type="application/xml"',
    '</openapi.json>; rel="service-desc"; type="application/json"',
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</rss.xml>; rel="alternate"; type="application/rss+xml"',
].join(", ");

// Does the Accept header rank markdown strictly above HTML? Only
// explicit types count — wildcard ranges (star-slash-star, text/*)
// match both representations equally, so they can never tip the
// choice. Ties go to HTML, the canonical representation. A browser's
// default header (html high, wildcard at q=0.8) stays on HTML; an
// agent's bare `Accept: text/markdown` gets markdown.
function prefersMarkdown(accept: string | null): boolean {
    if (!accept || !accept.toLowerCase().includes("markdown")) return false;
    let md = 0;
    let html = 0;
    for (const part of accept.split(",")) {
        const [rawType, ...params] = part.trim().split(";");
        const type = rawType.trim().toLowerCase();
        let q = 1;
        for (const p of params) {
            const [k, v] = p.trim().split("=");
            if (k.trim() === "q") {
                const n = Number(v);
                if (Number.isFinite(n)) q = n;
            }
        }
        if (type === "text/markdown" || type === "text/x-markdown") {
            md = Math.max(md, q);
        } else if (type === "text/html" || type === "application/xhtml+xml") {
            html = Math.max(html, q);
        }
    }
    return md > 0 && md > html;
}

/**
 * The markdown twin for a pathname, or null when none exists. Twins
 * cover the content surfaces only: `/<pub>` and `/<pub>/<slug>` (for
 * live publication slugs), `/feed`, and `/feed/<rkey>`. The slug
 * character class has no dot, so file-ish paths (`/posts/rss.xml`)
 * and existing `.md` URLs never match. Collections come from the
 * loader's memoized fetch; on upstream failure we just skip
 * negotiation and serve HTML.
 */
async function markdownTwin(pathname: string): Promise<string | null> {
    const m = pathname.match(/^\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (!m) return null;
    const [, first, second] = m;
    if (first === "feed") {
        return second ? `/feed/${second}.md` : "/feed.md";
    }
    try {
        if (!(await publicationSlugSet()).has(first)) return null;
    } catch {
        return null;
    }
    return second ? `/${first}/${second}.md` : `/${first}.md`;
}

/** AI crawlers and agent runtimes, by user agent. Used to decide who
 *  gets a markdown representation when they did not ask for one. */
const AGENT_UA = new RegExp(`(${AGENT_CRAWLERS.join("|")})`, "i");

function wantsMarkdown(request: Request): boolean {
    return (
        prefersMarkdown(request.headers.get("accept")) ||
        AGENT_UA.test(request.headers.get("user-agent") ?? "")
    );
}

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname, search } = context.url;
    const method = context.request.method;

    if (pathname !== "/" && pathname.endsWith("/")) {
        return context.redirect(
            pathname.replace(/\/+$/, "") + search,
            301,
        );
    }

    // ?mode=agent — hand an agent the machine-readable view of this
    // page instead of the rendered one. On the homepage that's the
    // markdown site map; anywhere with a markdown twin, that twin.
    // Cheap for an agent that arrives from search with no other
    // context, and harmless for everyone else.
    if (
        (method === "GET" || method === "HEAD") &&
        context.url.searchParams.get("mode") === "agent"
    ) {
        const target =
            pathname === "/"
                ? "/index.md"
                : ((await markdownTwin(pathname)) ?? "/index.md");
        // A redirect rather than an internal rewrite: the markdown
        // twins are static assets, which the asset layer serves before
        // the worker's router — `next(target)` can't reach them.
        return context.redirect(target, 302);
    }

    // Markdown content negotiation: a URL with a markdown twin,
    // requested with Accept ranking markdown above HTML, rewrites to
    // the twin — same URL, markdown body. Content-Location names the
    // concrete variant served, per RFC 9110.
    // The homepage has no twin to rewrite to — /index.md is a static
    // asset, which next() cannot reach — so serve the same markdown
    // inline. This is the URL a cold-arriving agent hits first, and
    // acceptmarkdown.com compliance is judged on it.
    if (
        (method === "GET" || method === "HEAD") &&
        pathname === "/" &&
        wantsMarkdown(context.request)
    ) {
        const body = await homepageMarkdown();
        const res = new Response(method === "HEAD" ? null : body, {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Location": "/index.md",
                Vary: "Accept, Accept-Encoding, User-Agent",
                "Cache-Control": "public, s-maxage=300",
                Link: AGENT_LINKS,
            },
        });
        for (const [h, v] of Object.entries(SECURITY_HEADERS)) {
            if (!res.headers.has(h)) res.headers.set(h, v);
        }
        return res;
    }

    const twin =
        method === "GET" || method === "HEAD"
            ? await markdownTwin(pathname)
            : null;

    let response: Response;
    if (twin && wantsMarkdown(context.request)) {
        response = await next(twin + search);
        response.headers.set("Content-Location", twin);
    } else {
        response = await next();
    }

    // Both variants of a negotiable resource vary on Accept — the
    // canonical URL because it can answer with either representation,
    // the .md URL so caches never fold it into the HTML entry.
    if (twin || pathname.endsWith(".md")) {
        // User-Agent matters here too: AI crawlers get markdown even
        // when they ask for HTML, so a cache keyed only on Accept
        // would hand a browser the crawler's variant.
        response.headers.set("Vary", "Accept, Accept-Encoding, User-Agent");
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (
        !response.headers.has("Link") &&
        (contentType.startsWith("text/html") ||
            contentType.startsWith("text/markdown"))
    ) {
        response.headers.set("Link", AGENT_LINKS);
    }

    // Agent-recoverable 404s. A human gets the rendered page; a client
    // that asked for markdown, or identifies as an AI crawler, gets a
    // short document naming the indexes it should try instead. Status
    // stays 404 either way — a soft 200 would teach agents every path
    // exists.
    if (
        response.status === 404 &&
        (method === "GET" || method === "HEAD") &&
        wantsMarkdown(context.request)
    ) {
        response = new Response(
            method === "HEAD" ? null : notFoundMarkdown(pathname),
            {
                status: 404,
                headers: {
                    "Content-Type": "text/markdown; charset=utf-8",
                    "Cache-Control": "no-store",
                    Vary: "Accept, Accept-Encoding, User-Agent",
                    Link: AGENT_LINKS,
                },
            },
        );
    }

    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        if (!response.headers.has(header)) {
            response.headers.set(header, value);
        }
    }
    return response;
});
