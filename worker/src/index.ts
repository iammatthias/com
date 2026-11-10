import type { Ctx, Env, Route } from "./routes/context";
import { agentRoutes } from "./routes/agent";
import { mcpRoutes } from "./routes/mcp";
import { wellKnownRoutes } from "./routes/wellknown";
import { apiFallbackRoute, apiRoutes } from "./routes/api";
import { graphqlRoutes } from "./routes/graphql";
import { appRoutes, proxyBlob } from "./routes/app";
import { ogRoutes } from "./routes/og";
import { setRuntimeEnv } from "./lib/runtime-env";
import { agentModeRedirect, markdownTwin, redirectFor, sameOriginPath } from "./lib/redirects";
import { redirectDeps, resolveAppRoute } from "./lib/app-route";
import { publicationSlugSet } from "./lib/farfield-loader";
import { homepageMarkdown, notFoundMarkdown } from "./lib/agent-markdown";
import { AGENT_LINKS, SECURITY_HEADERS, markdownByAgentOnly, wantsMarkdown } from "./lib/negotiate";
import { cachePolicyFor, EDGE_CACHE_HEADER, setShellCacheHeaders, type CachePolicy } from "./lib/cache";
import { notFoundPage, renderRoute, type SsrPage } from "./lib/ssr";
import { shellResponse } from "./lib/shell";
import { ENTRY_LOOP_PATH } from "./lib/og-card";
import { OG_VIDEO } from "./lib/seo";
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

const HASHED_ASSET = /^\/b\/[0-9a-f]{16}\//;
const IMMUTABLE_ASSET = /^\/(?:fonts|og)-v\d+\//;
const KEPT_FOR_A_YEAR = "public, max-age=31536000, immutable";

function redirect(to: string, status: 301 | 302): Response {
    const location = sameOriginPath(to) ?? "/";
    return new Response(null, { status, headers: { Location: location, Link: AGENT_LINKS } });
}

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

const NEGOTIATED_VARY = "Accept, Accept-Encoding";

function keepPrivate(res: Response): void {
    res.headers.set("Cache-Control", "private, max-age=300");
    res.headers.set(EDGE_CACHE_HEADER, "no-store");
}

function withoutBody(res: Response): Response {
    return new Response(null, { status: res.status, statusText: res.statusText, headers: res.headers });
}

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

async function loopCid(ctx: Ctx, sig: string): Promise<string | null> {
    const label = `ogv:v1:${sig}`;
    const known = await ctx.env.CONTENT_CACHE?.get(label, { cacheTtl: 300 });
    if (known) return known;
    try {
        const res = await fetch(`https://blobs.farfield.systems/pins/${label}`, {
            headers: { "User-Agent": "iammatthias.com/1.0 (+https://iammatthias.com)" },
            signal: AbortSignal.timeout(3000),
        });
        if (res.status !== 200) {
            await res.body?.cancel();
            return null;
        }
        const { cid } = (await res.json()) as { cid?: string };
        if (!cid) return null;
        const kv = ctx.env.CONTENT_CACHE;
        if (kv) ctx.exec.waitUntil(kv.put(label, cid, { expirationTtl: 3600 }));
        return cid;
    } catch {
        return null;
    }
}

async function entryLoop(ctx: Ctx, sig: string): Promise<Response> {
    const cid = await loopCid(ctx, sig);
    if (cid) {
        const own = await proxyBlob(cid, ctx.request);
        if (own.ok || own.status === 206 || own.status === 416) return own;
        await own.body?.cancel();
    }
    const shared = await kept(ctx, await ctx.env.ASSETS.fetch(new Request(new URL(OG_VIDEO.path, ctx.url), { method: "GET" })));
    shared.headers.set("Cache-Control", "public, max-age=300");
    shared.headers.set(EDGE_CACHE_HEADER, "no-store");
    return shared;
}

function fetchShell(ctx: Ctx): Promise<Response> {
    return ctx.env.ASSETS.fetch(new Request(new URL("/", ctx.url)));
}

async function shellPage(ctx: Ctx, page: SsrPage, policy: CachePolicy, pending: Promise<Response> = fetchShell(ctx)): Promise<Response> {
    const shell = await pending;
    if (!shell.ok) {
        await shell.body?.cancel();
        return new Response("The app build is missing: run `trunk build --release` in ../app.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
    }
    const res = await shellResponse(shell, page, ctx.request.method, ctx.url.pathname, ctx.url.origin);
    setShellCacheHeaders(res, policy);
    return res;
}

async function htmlRoute(ctx: Ctx, pathname: string): Promise<Response> {
    const shell = fetchShell(ctx);
    const dropShell = () => shell.then((r) => r.body?.cancel()).catch(() => undefined);
    shell.catch(() => undefined);
    let page: SsrPage;
    let policy: CachePolicy;
    try {
        const route = await resolveAppRoute(pathname, ctx.url.search, { redirects: pathname !== ctx.url.pathname });
        if (route.kind === "redirect") {
            await dropShell();
            return redirect(route.to, route.status);
        }
        page = route.kind === "notfound" ? notFoundPage(pathname) : await renderRoute(route, pathname);
        policy = cachePolicyFor(route);
    } catch (err) {
        console.error(`[html] ${pathname} failed:`, err);
        await dropShell();
        return new Response("Upstream content is unavailable; try again shortly.", {
            status: 502,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
    }
    return shellPage(ctx, page, policy, shell);
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
        const asset = await ctx.env.ASSETS.fetch(immutable ? new Request(ctx.url, { method: "GET" }) : ctx.request);
        if (asset.status < 400) return immutable ? kept(ctx, asset) : asset;
        await asset.body?.cancel();
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
        const res = await dispatch(ctx, pathname);
        return secure(new Response(res.body, res));
    }
    const loop = isRead ? pathname.match(ENTRY_LOOP_PATH) : null;
    if (loop) return secure(await entryLoop(ctx, loop[1]));
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
        response = await shellPage(ctx, notFoundPage(pathname), cachePolicyFor({ kind: "notfound" }));
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

const PRODUCTION_HOSTS = new Set(["iammatthias.com"]);

const REDIRECT_HOSTS = new Set(["www.iammatthias.com", "next.iammatthias.com", "iam.contact"]);

function toApex(request: Request): Response | null {
    const url = new URL(request.url);
    if (!REDIRECT_HOSTS.has(url.hostname)) return null;
    return finish(new Response(null, { status: 301, headers: { Location: `https://iammatthias.com${url.pathname}${url.search}` } }));
}

function offTheRecord(request: Request, response: Response): Response {
    const production = PRODUCTION_HOSTS.has(new URL(request.url).hostname);
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
