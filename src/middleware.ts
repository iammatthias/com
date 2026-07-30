// Trailing-slash normalization + security headers for on-demand routes.
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

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname, search } = context.url;

    if (pathname !== "/" && pathname.endsWith("/")) {
        return context.redirect(
            pathname.replace(/\/+$/, "") + search,
            301,
        );
    }

    const response = await next();
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        if (!response.headers.has(header)) {
            response.headers.set(header, value);
        }
    }
    return response;
});
