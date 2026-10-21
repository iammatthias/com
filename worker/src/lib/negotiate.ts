import { AGENT_CRAWLERS } from "./agent-surface";

/** Ported from com/src/middleware.ts. */

/**
 * Same policy as the old site, plus what the GPUI shell needs:
 * 'wasm-unsafe-eval' to instantiate the app, blob: workers and images,
 * and same-origin fetch for /api/app/* and /img/*.
 */
export const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://wsrv.nl https://blobs.farfield.systems",
    "media-src 'self' blob: https://blobs.farfield.systems",
    "connect-src 'self' https://wsrv.nl https://blobs.farfield.systems https://ethereum-rpc.publicnode.com https://cloudflare-eth.com https://cloudflareinsights.com",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": CSP,
};

export const AGENT_LINKS = [
    '</llms.txt>; rel="describedby"; type="text/markdown"',
    '</index.md>; rel="alternate"; type="text/markdown"',
    '</sitemap.xml>; rel="sitemap"; type="application/xml"',
    '</openapi.json>; rel="service-desc"; type="application/json"',
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</rss.xml>; rel="alternate"; type="application/rss+xml"',
].join(", ");

export function prefersMarkdown(accept: string | null): boolean {
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

const AGENT_UA = new RegExp(`(${AGENT_CRAWLERS.join("|")})`, "i");

/**
 * Markdown chosen by the User-Agent alone. Caches key on Accept, not User-Agent, so such a
 * response must stay out of shared caches: a browser sending the same Accept would get it.
 */
export function markdownByAgentOnly(request: Request): boolean {
    return (
        !prefersMarkdown(request.headers.get("accept")) &&
        AGENT_UA.test(request.headers.get("user-agent") ?? "")
    );
}

export function wantsMarkdown(request: Request): boolean {
    return (
        prefersMarkdown(request.headers.get("accept")) ||
        AGENT_UA.test(request.headers.get("user-agent") ?? "")
    );
}
