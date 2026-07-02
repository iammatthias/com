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

const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
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
