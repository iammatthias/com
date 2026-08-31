
import { defineMiddleware } from "astro:middleware";
import { publicationSlugSet } from "@lib/farfield-loader";
import { homepageMarkdown } from "@lib/agent-markdown";
import { notFoundMarkdown } from "@lib/agent-markdown";
import { AGENT_CRAWLERS } from "@lib/agent-surface";

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
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    ...(import.meta.env.PROD ? { "Content-Security-Policy": CSP } : {}),
};

const AGENT_LINKS = [
    '</llms.txt>; rel="describedby"; type="text/markdown"',
    '</index.md>; rel="alternate"; type="text/markdown"',
    '</sitemap.xml>; rel="sitemap"; type="application/xml"',
    '</openapi.json>; rel="service-desc"; type="application/json"',
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</rss.xml>; rel="alternate"; type="application/rss+xml"',
].join(", ");

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

    if (
        (method === "GET" || method === "HEAD") &&
        context.url.searchParams.get("mode") === "agent"
    ) {
        const target =
            pathname === "/"
                ? "/index.md"
                : ((await markdownTwin(pathname)) ?? "/index.md");
        return context.redirect(target, 302);
    }

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

    if (twin || pathname.endsWith(".md")) {
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
