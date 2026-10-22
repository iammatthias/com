import type { Ctx, Env, Route } from "./routes/context";
import { agentRoutes } from "./routes/agent";
import { mcpRoutes } from "./routes/mcp";
import { wellKnownRoutes } from "./routes/wellknown";
import { apiFallbackRoute, apiRoutes } from "./routes/api";
import { graphqlRoutes } from "./routes/graphql";
import { appRoutes } from "./routes/app";
import { ogRoutes } from "./routes/og";
import { setRuntimeEnv } from "./lib/runtime-env";
import { agentModeRedirect, markdownTwin, redirectFor, sameOriginPath } from "./lib/redirects";
import { redirectDeps, resolveAppRoute } from "./lib/app-route";
import { publicationSlugSet } from "./lib/farfield-loader";
import { homepageMarkdown, notFoundMarkdown } from "./lib/agent-markdown";
import { AGENT_LINKS, SECURITY_HEADERS, markdownByAgentOnly, wantsMarkdown } from "./lib/negotiate";
import { EDGE_CACHE_HEADER, setShellCacheHeaders } from "./lib/cache";
import { notFoundPage, renderRoute, type SsrPage } from "./lib/ssr";
import { shellResponse } from "./lib/shell";
import { STATIC_PAGES } from "./pages/static";
import { bindExecution, runInRequest } from "./lib/request-scope";
import { byteRange, etagMatches } from "./lib/http";

const ROUTES: Route[] = [
    ...mcpRoutes,
    ...graphqlRoutes,
    ...wellKnownRoutes,
    ...ogRoutes,
    ...appRoutes,
    ...apiRoutes,
    ...agentRoutes,
    apiFallbackRoute,
];

/** A release build's code (worker/scripts/scope-build.ts): a new build never writes a URL an old one
 *  used, and a deploy carries the two builds before it (worker/scripts/ci-build.sh). */
const HASHED_ASSET = /^\/b\/[0-9a-f]{16}\//;
/** Files whose URL changes when they do: the versioned faces and the social loop (og:video). */
const IMMUTABLE_ASSET = /^\/(?:fonts|og)-v\d+\//;
const KEPT_FOR_A_YEAR = "public, max-age=31536000, immutable";

/**
 * com's _headers puts this Link on every asset response, and the asset-config
 * redirects (e.g. /sitemap-index.xml) carry it too; every redirect here does.
 */
function redirect(to: string, status: 301 | 302): Response {
    // every Location is built from the request path: never let one point off-site
    const location = sameOriginPath(to) ?? "/";
    return new Response(null, { status, headers: { Location: location, Link: AGENT_LINKS } });
}

/**
 * Responses the old site served from its asset layer (public/ or prerendered),
 * which com/public/_headers stamps with the discovery Link. HTML and markdown
 * get it below regardless of path.
 */
const ASSET_LINK_PATH =
    /^\/(?:robots\.txt|favicon\.svg|rss\.xml\.xsl|openapi\.json|schema\.graphql|api\/search-vectors\.json|\.well-known\/(?:atproto-did|api-catalog|oauth-protected-resource|.+\.json))$/;

function decodeParams(m: RegExpMatchArray): string[] {
    return m.slice(1).map((p) => {
        if (p === undefined) return p as unknown as string;
        try {
            return decodeURIComponent(p);
        } catch {
            return p;
        }
    });
}

/** Negotiated on Accept only: varying on User-Agent would split the edge cache per browser. */
const NEGOTIATED_VARY = "Accept, Accept-Encoding";

/** Markdown picked by User-Agent alone is this agent's copy: no shared cache may keep it. */
function keepPrivate(res: Response): void {
    res.headers.set("Cache-Control", "private, max-age=300");
    res.headers.set(EDGE_CACHE_HEADER, "no-store");
}

function withoutBody(res: Response): Response {
    return new Response(null, { status: res.status, statusText: res.statusText, headers: res.headers });
}

/**
 * A file kept for a year, answered from the whole of it as the asset layer sent it: a HEAD gets
 * its headers, and a Range the slice it asks for (a video's player asks in ranges; Safari's won't
 * play without them), marked so the edge never keeps the slice in place of the whole.
 */
async function kept(ctx: Ctx, asset: Response): Promise<Response> {
    const method = ctx.request.method;
    const res = new Response(method === "HEAD" ? null : asset.body, asset);
    if (method === "HEAD") await asset.body?.cancel();
    if (asset.status !== 200) {
        res.headers.set("Cache-Control", "no-store");
        res.headers.set(EDGE_CACHE_HEADER, "no-store");
        return res;
    }
    res.headers.set("Cache-Control", KEPT_FOR_A_YEAR);
    res.headers.set("Accept-Ranges", "bytes");
    const range = method === "GET" ? ctx.request.headers.get("Range") : null;
    if (!range) return res;
    const whole = await res.arrayBuffer();
    const want = byteRange(range, whole.byteLength);
    if (want.kind === "whole") return new Response(whole, res);
    const headers = new Headers(res.headers);
    headers.set(EDGE_CACHE_HEADER, "no-store");
    // the slice is of the decoded body: no encoding the runtime would apply again
    headers.delete("Content-Encoding");
    if (want.kind === "none") {
        headers.set("Content-Range", `bytes */${whole.byteLength}`);
        headers.set("Cache-Control", "no-store");
        return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${want.start}-${want.end}/${whole.byteLength}`);
    headers.set("Content-Length", String(want.end - want.start + 1));
    return new Response(whole.slice(want.start, want.end + 1), { status: 206, headers });
}

function fetchShell(ctx: Ctx): Promise<Response> {
    return ctx.env.ASSETS.fetch(new Request(new URL("/", ctx.url)));
}

async function shellPage(ctx: Ctx, page: SsrPage, pending: Promise<Response> = fetchShell(ctx)): Promise<Response> {
    const shell = await pending;
    if (!shell.ok) {
        await shell.body?.cancel();
        return new Response("The app build is missing: run `trunk build --release` in ../app.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
    }
    const res = await shellResponse(shell, page, ctx.request.method, ctx.url.pathname, ctx.url.origin);
    setShellCacheHeaders(res, page);
    return res;
}

async function htmlRoute(ctx: Ctx, pathname: string): Promise<Response> {
    // the shell downloads while the page renders
    const shell = fetchShell(ctx);
    const dropShell = () => shell.then((r) => r.body?.cancel()).catch(() => undefined);
    shell.catch(() => undefined);
    let page: SsrPage;
    try {
        // handle() already looked for a redirect at the request's own path
        const route = await resolveAppRoute(pathname, ctx.url.search, { redirects: pathname !== ctx.url.pathname });
        if (route.kind === "redirect") {
            await dropShell();
            return redirect(route.to, route.status);
        }
        page = route.kind === "notfound" ? notFoundPage(pathname) : await renderRoute(route, pathname);
    } catch (err) {
        console.error(`[html] ${pathname} failed:`, err);
        await dropShell();
        return new Response("Upstream content is unavailable; try again shortly.", {
            status: 502,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
    }
    return shellPage(ctx, page, shell);
}

async function dispatch(ctx: Ctx, pathname: string): Promise<Response> {
    const method = ctx.request.method;
    const lookup = method === "HEAD" ? ["HEAD", "GET"] : [method];
    for (const route of ROUTES) {
        if (!lookup.some((m) => route.methods.includes(m))) continue;
        const m = pathname.match(route.pattern);
        if (!m) continue;
        const res = await route.handler({ ...ctx, params: decodeParams(m) });
        if (res) return method === "HEAD" && res.body ? withoutBody(res) : res;
    }

    if (method !== "GET" && method !== "HEAD") {
        return new Response(null, { status: 404 });
    }

    if (/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".html")) {
        const immutable = HASHED_ASSET.test(pathname) || IMMUTABLE_ASSET.test(pathname);
        // a file the browser keeps for a year is fetched whole: a plain GET, never a HEAD, a range or a
        // conditional request, whose bodiless answer the edge would otherwise keep in its place
        const asset = await ctx.env.ASSETS.fetch(immutable ? new Request(ctx.url, { method: "GET" }) : ctx.request);
        if (asset.status < 400) return immutable ? kept(ctx, asset) : asset;
        await asset.body?.cancel();
        // a build's file or a face that isn't there: no page to render, and nothing for the edge
        // to keep in place of the file a deploy will add
        if (immutable) {
            return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", [EDGE_CACHE_HEADER]: "no-store" } });
        }
    }

    return htmlRoute(ctx, pathname);
}

async function handle(request: Request, env: Env, exec: ExecutionContext): Promise<Response> {
    setRuntimeEnv(env as unknown as Record<string, unknown>);
    const url = new URL(request.url);
    const { pathname, search } = url;
    const method = request.method;
    const isRead = method === "GET" || method === "HEAD";
    const ctx: Ctx = { request, url, env, exec, params: [] };
    bindExecution(exec);

    if (HASHED_ASSET.test(pathname) || IMMUTABLE_ASSET.test(pathname) || pathname.startsWith("/img/")) {
        // their own edge policy stands (no finish()), but they get the security headers
        const res = await dispatch(ctx, pathname);
        return secure(new Response(res.body, res));
    }
    // the social card's own page (app/card), for the og Worker's browser: files, never a route
    if (pathname.startsWith("/card/")) {
        const res = await env.ASSETS.fetch(request);
        return finish(new Response(res.body, res));
    }

    const moved = await redirectFor(pathname, search, method, redirectDeps);
    if (moved) return finish(redirect(moved.to, moved.status));

    if (isRead && url.searchParams.get("mode") === "agent") {
        const page = STATIC_PAGES[pathname.slice(1)];
        const target = page && page.slug !== "developers" ? `/${page.slug}.md` : pathname === "/developers" ? "/developers.md" : await agentModeRedirect(pathname, publicationSlugSet);
        return finish(redirect(target, 302));
    }

    if (isRead && pathname === "/" && wantsMarkdown(request)) {
        const res = new Response(method === "HEAD" ? null : await homepageMarkdown(), {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Location": "/index.md",
                Vary: NEGOTIATED_VARY,
                "Cache-Control": "public, s-maxage=300",
                Link: AGENT_LINKS,
            },
        });
        if (markdownByAgentOnly(request)) keepPrivate(res);
        return finish(res);
    }

    const negotiates = pathname === "/feed" || pathname.startsWith("/feed/");
    const twin = negotiates && isRead ? await markdownTwin(pathname, publicationSlugSet) : null;

    let response: Response;
    if (twin && wantsMarkdown(request)) {
        response = await dispatch(ctx, twin);
        response = new Response(response.body, response);
        response.headers.set("Content-Location", twin);
        if (markdownByAgentOnly(request)) keepPrivate(response);
    } else {
        response = await dispatch(ctx, pathname);
        response = new Response(response.body, response);
    }

    if (twin || pathname === "/" || pathname.endsWith(".md")) {
        response.headers.set("Vary", NEGOTIATED_VARY);
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (
        !response.headers.has("Link") &&
        (contentType.startsWith("text/html") ||
            contentType.startsWith("text/markdown") ||
            ASSET_LINK_PATH.test(pathname))
    ) {
        response.headers.set("Link", AGENT_LINKS);
    }

    if (
        isRead &&
        response.status === 200 &&
        etagMatches(request.headers.get("If-None-Match"), response.headers.get("ETag"))
    ) {
        await response.body?.cancel();
        response = new Response(null, { status: 304, headers: response.headers });
    }

    if (response.status === 404 && isRead && wantsMarkdown(request)) {
        response = new Response(method === "HEAD" ? null : notFoundMarkdown(pathname), {
            status: 404,
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Cache-Control": "no-store",
                Vary: NEGOTIATED_VARY,
                Link: AGENT_LINKS,
            },
        });
    } else if (response.status === 404 && isRead && !contentType && !pathname.startsWith("/api/")) {
        await response.body?.cancel();
        response = await shellPage(ctx, notFoundPage(pathname));
        if (!response.headers.has("Link")) response.headers.set("Link", AGENT_LINKS);
    }

    return finish(response);
}

function secure(response: Response): Response {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        if (!response.headers.has(header)) response.headers.set(header, value);
    }
    return response;
}

function finish(response: Response): Response {
    secure(response);
    if (!response.headers.has(EDGE_CACHE_HEADER)) {
        response.headers.set(EDGE_CACHE_HEADER, "no-store");
    }
    return response;
}

/** The site's own address; anywhere else (a staging subdomain, a preview) stays out of search. */
const PRODUCTION_HOSTS = new Set(["iammatthias.com"]);

/** The site's other names, each sent to the same path on the apex. */
const REDIRECT_HOSTS = new Set(["www.iammatthias.com", "next.iammatthias.com", "iam.contact"]);

function toApex(request: Request): Response | null {
    const url = new URL(request.url);
    if (!REDIRECT_HOSTS.has(url.hostname)) return null;
    return finish(new Response(null, { status: 301, headers: { Location: `https://iammatthias.com${url.pathname}${url.search}` } }));
}

function offTheRecord(request: Request, response: Response): Response {
    const production = PRODUCTION_HOSTS.has(new URL(request.url).hostname);
    // a HEAD answer has no body: the edge must never keep it as the answer to a GET
    if (production && request.method !== "HEAD") return response;
    const out = new Response(response.body, response);
    if (!production) out.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (request.method === "HEAD") out.headers.set(EDGE_CACHE_HEADER, "no-store");
    return out;
}

export default {
    async fetch(request: Request, env: Env, exec: ExecutionContext): Promise<Response> {
        try {
            const moved = toApex(request);
            if (moved) return moved;
            return offTheRecord(request, await runInRequest(() => handle(request, env, exec)));
        } catch (err) {
            console.error("[worker] unhandled:", err);
            return finish(
                new Response("Something went wrong on our side; try again shortly.", {
                    status: 500,
                    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
                }),
            );
        }
    },
} satisfies ExportedHandler<Env>;
