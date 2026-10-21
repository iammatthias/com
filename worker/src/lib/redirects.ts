import { isStampedSlug } from "./slugs";

export const RENAMED_PUBLICATIONS: Record<string, string> = {
    "open-source": "experiments",
};

export const MOVED_ENTRIES: Record<string, string> = {
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

export interface RedirectDeps {
    publications(): Promise<Set<string>>;
    stampedHref(publication: string, slug: string): Promise<string | null>;
}

export interface Redirect {
    to: string;
    status: 301 | 302;
}

export function trailingSlashRedirect(pathname: string): string | null {
    if (pathname === "/" || !pathname.endsWith("/")) return null;
    // a leading "//" would make the Location protocol-relative: another host
    return pathname.replace(/^\/+/, "/").replace(/\/+$/, "") || "/";
}

const PROBE_ORIGIN = "https://same-origin.invalid";

/** `to` as a same-origin path (with its query and fragment), or null when it would leave the site. */
export function sameOriginPath(to: string): string | null {
    let target: URL;
    try {
        target = new URL(to, PROBE_ORIGIN);
    } catch {
        return null;
    }
    if (target.origin !== PROBE_ORIGIN) return null;
    return target.pathname + target.search + target.hash;
}

export function renamedPublication(pathname: string): string | null {
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

export async function stampedRedirect(
    pathname: string,
    deps: RedirectDeps,
): Promise<string | null> {
    const m = pathname.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)(\.md)?$/);
    if (!m) return null;
    const [, publication, slug, ext = ""] = m;
    if (isStampedSlug(slug)) return null;
    try {
        if (!(await deps.publications()).has(publication)) return null;
        const href = await deps.stampedHref(publication, slug);
        return href ? `${href}${ext}` : null;
    } catch {
        return null;
    }
}

/** Onchain Analytics is a post now; its sessions are fragments of it (as on com). */
export const ONCHAIN_ANALYTICS_POST = "/experiments/1791937789859-onchain-analytics";

export function legacyRedirect(pathname: string): string | null {
    if (pathname === "/sitemap-index.xml") return "/sitemap.xml";
    if (pathname === "/onchain-analytics") return ONCHAIN_ANALYTICS_POST;
    if (pathname === "/onchain-analytics.md") return `${ONCHAIN_ANALYTICS_POST}.md`;
    const session = pathname.match(/^\/onchain-analytics\/(0x[0-9a-fA-F]{64})$/);
    if (session) return `${ONCHAIN_ANALYTICS_POST}#${session[1].toLowerCase()}`;
    if (pathname === "/post" || pathname.startsWith("/post/")) return "/content";
    if (pathname.startsWith("/content/")) {
        const isPageRoute = /^\/content\/page\/[^/]+$/.test(pathname);
        if (!isPageRoute) return "/content";
    }
    return null;
}

/**
 * The redirect table, in the order the old middleware and page routes
 * applied it. `pathname` is the raw URL path; `search` (with its "?") is
 * carried onto the target except for the page-level legacy redirects,
 * which, like Astro.redirect, drop it.
 */
export async function redirectFor(
    pathname: string,
    search: string,
    method: string,
    deps: RedirectDeps,
): Promise<Redirect | null> {
    const slash = trailingSlashRedirect(pathname);
    if (slash) return { to: slash + search, status: 301 };

    if (method !== "GET" && method !== "HEAD") return null;

    const renamed = renamedPublication(pathname);
    if (renamed) return { to: renamed + search, status: 301 };

    const canonical = await stampedRedirect(pathname, deps);
    if (canonical) return { to: canonical + search, status: 301 };

    const legacy = legacyRedirect(pathname);
    if (legacy) return { to: legacy, status: 301 };

    return null;
}

export async function markdownTwin(
    pathname: string,
    publications: () => Promise<Set<string>>,
): Promise<string | null> {
    const m = pathname.match(/^\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (!m) return null;
    const [, first, second] = m;
    if (first === "feed") {
        return second ? `/feed/${second}.md` : "/feed.md";
    }
    try {
        if (!(await publications()).has(first)) return null;
    } catch {
        return null;
    }
    return second ? `/${first}/${second}.md` : `/${first}.md`;
}

export async function agentModeRedirect(
    pathname: string,
    publications: () => Promise<Set<string>>,
): Promise<string> {
    return pathname === "/"
        ? "/index.md"
        : ((await markdownTwin(pathname, publications)) ?? "/index.md");
}
