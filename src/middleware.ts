
import { defineMiddleware } from "astro:middleware";
import type { APIContext } from "astro";
import {
    isStampedSlug,
    publicationSlugSet,
    stampedHref,
} from "@lib/farfield-loader";
import { homepageMarkdown } from "@lib/agent-markdown";
import { notFoundMarkdown } from "@lib/agent-markdown";
import { EDGE_CACHE_HEADER, edgeCacheDirective } from "@lib/cache";
import { representationFor, type SiteProps } from "@lib/negotiate";

const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://wsrv.nl https://blobs.farfield.systems",
    "media-src 'self' https://blobs.farfield.systems",
    "connect-src 'self' https://sepolia.base.org https://conet.fm https://ethereum-rpc.publicnode.com https://cloudflare-eth.com https://cloudflareinsights.com",
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

const RENAMED_PUBLICATIONS: Record<string, string> = {
    "open-source": "experiments",
};

const MOVED_ENTRIES: Record<string, string> = {
    "/open-source/1744172723728-obsidian-pinata-image-uploader":
        "/experiments/1789490903000-obsidian-plugins",
    "/open-source/1744172769110-obsidian-ai-tagger":
        "/experiments/1789490903000-obsidian-plugins",
    "/open-source/1744172798323-obsidian-ai-excerpt-generator":
        "/experiments/1789490903000-obsidian-plugins",
    "/open-source/1746490719151-llm-fid-txt":
        "/experiments/1789491297000-llm-txt-fun",
    "/open-source/1767381212267-llm-txt-fun":
        "/experiments/1789491297000-llm-txt-fun",
    "/open-source/1768762943567-nimbus":
        "/experiments/1789491418000-atproto",
    "/open-source/1769545357371-sonde":
        "/experiments/1789491418000-atproto",
    "/open-source/1776737859309-atproto-wc":
        "/experiments/1789491418000-atproto",
};

function renamedPublication(pathname: string): string | null {
    const markdown = pathname.endsWith(".md");
    const bare = markdown ? pathname.slice(0, -3) : pathname;
    const withExt = (target: string) => (markdown ? `${target}.md` : target);

    const moved = MOVED_ENTRIES[bare];
    if (moved) return withExt(moved);

    for (const [from, to] of Object.entries(RENAMED_PUBLICATIONS)) {
        if (bare === `/${from}`) return withExt(`/${to}`);
        if (bare.startsWith(`/${from}/`)) return withExt(`/${to}`);
    }
    return null;
}

async function stampedRedirect(pathname: string): Promise<string | null> {
    const m = pathname.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)(\.md)?$/);
    if (!m) return null;
    const [, publication, slug, ext = ""] = m;
    if (isStampedSlug(slug)) return null;
    try {
        if (!(await publicationSlugSet()).has(publication)) return null;
        const href = await stampedHref(publication, slug);
        return href ? `${href}${ext}` : null;
    } catch {
        return null;
    }
}

function wantsMarkdown(context: APIContext): boolean {
    const props = (context.locals as { cfContext?: { props?: Partial<SiteProps> } })
        .cfContext?.props;
    return (props?.representation ?? representationFor(context.request)) === "markdown";
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

    if (method === "GET" || method === "HEAD") {
        const renamed = renamedPublication(pathname);
        if (renamed) return context.redirect(renamed + search, 301);

        const canonical = await stampedRedirect(pathname);
        if (canonical) return context.redirect(canonical + search, 301);
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
        wantsMarkdown(context)
    ) {
        const body = await homepageMarkdown();
        const res = new Response(method === "HEAD" ? null : body, {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Location": "/index.md",
                Vary: "Accept, Accept-Encoding, User-Agent",
                "Cache-Control": "public, s-maxage=300",
                [EDGE_CACHE_HEADER]: edgeCacheDirective(300),
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
    if (twin && wantsMarkdown(context)) {
        response = await next(twin + search);
        response.headers.set("Content-Location", twin);
    } else {
        response = await next();
    }

    if (twin || pathname === "/" || pathname.endsWith(".md")) {
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
        wantsMarkdown(context)
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
