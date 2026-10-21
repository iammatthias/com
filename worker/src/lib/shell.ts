import { fullTitle, headHtml } from "./seo";
import { cardImageUrl } from "./og-card";
import type { SsrPage } from "./ssr";
import { etagFor } from "./http";

/**
 * The app shell is Trunk's dist/index.html (hashed com-*.js / *_bg.wasm).
 * Each human route gets that shell with its own <title>, canonical, OG and
 * JSON-LD, plus the route's full semantic HTML in <main id="ssr">. gpui_web
 * appends its <canvas> to <body>; the CSS below pins it over the document so
 * the SSR content stays in the document underneath (transparent, not hidden, so
 * assistive tech and agents still read it); the canvas reaches under mobile toolbars.
 */

const SHELL_CSS = `<style id="ssr-css">
html:has(>body>canvas),body:has(>canvas){height:100vh;height:100lvh;overflow:hidden}
canvas{position:absolute!important;top:0;left:0;z-index:1;width:100vw!important;height:100vh!important;height:100lvh!important}
body:has(>canvas){overflow:hidden}
#ssr-root{position:relative;z-index:0;max-width:46rem;margin:0 auto;padding:2rem 1.25rem 4rem;font:17px/1.6 Georgia,"Times New Roman",serif;color:#1b1814}
#ssr-root a{color:#1f55c2}
@media (prefers-color-scheme: dark){#ssr-root{color:#f0e9db}#ssr-root a{color:#a3c2ff}}
#ssr-root img,#ssr-root video,#ssr-root svg{max-width:100%;height:auto}
#ssr-root nav ol,#ssr-root nav ul{list-style:none;display:flex;flex-wrap:wrap;gap:.75rem;padding:0}
#ssr-root pre{overflow-x:auto}
#ssr-root h1{line-height:1.2;margin:.5rem 0 1rem}
#ssr-root dl div{display:flex;gap:.5rem}
html.js #ssr-root{position:absolute;width:1px;height:1px;padding:0;margin:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
html.js #ssr-root img{display:none}
</style>`;

/**
 * What the app asks for first, fetched alongside its own download rather than after it.
 * Only the home page draws the timeline; anywhere else its preload would go unused.
 */
function appPreloads(path: string): string {
    const index = `<link rel="preload" href="/api/app/index" as="fetch" crossorigin>`;
    return path === "/" ? `${index}<link rel="preload" href="/api/app/timeline?page=1" as="fetch" crossorigin>` : index;
}

const NOSCRIPT =
    `<noscript><p class="ssr-note">This site is drawn by an app that needs JavaScript and WebGPU or WebGL. ` +
    `Without it you are reading the plain version below; every page also has a markdown twin (add <code>.md</code>) and the whole site is indexed at <a href="/llms.txt">/llms.txt</a>.</p></noscript>`;

const SITE_HEADER =
    `<header id="ssr-header"><nav aria-label="Site"><ul><li><a href="/">home</a></li><li><a href="/menu">menu</a></li><li><a href="/content">content</a></li><li><a href="/feed">feed</a></li><li><a href="/about">about</a></li><li><a href="/developers">developers</a></li></ul></nav></header>`;

/** Exactly the inner HTML of <main id="ssr"> for a page (also served by /api/app/ssr). */
export function ssrMainHtml(page: SsrPage): string {
    return `${NOSCRIPT}${page.main}`;
}

/** Trunk's dev live-reload client. Harmless in release builds (absent), dead weight otherwise. */
const TRUNK_RELOAD = /<script>"use strict";\s*\(function \(\) \{\s*const address = '\{\{__TRUNK_ADDRESS__\}\}'[\s\S]*?<\/script>/;

/**
 * The server-rendered page is for agents and readers without scripts: when the app runs it is
 * out of sight, so its images load lazily and last, never competing with the app's download.
 * (Done on the string: HTML the rewriter inserts isn't seen by its own handlers.)
 */
export function quietImages(html: string): string {
    return html.replace(/<img\b([^>]*)>/g, (_, attrs: string) => {
        const rest = attrs.replace(/\s(?:loading|fetchpriority)="[^"]*"/g, "");
        return `<img loading="lazy" fetchpriority="low"${rest}>`;
    });
}

/** A path as the app's `encode` (src/site.rs) writes it into /api/app/route?path=, byte for byte,
 * so a preload is the very request the app makes. */
export function appPathParam(path: string): string {
    const bytes = new TextEncoder().encode(path);
    let out = "";
    for (const b of bytes) {
        const c = String.fromCharCode(b);
        out += /[A-Za-z0-9\-_.~\/]/.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    }
    return out;
}

export async function shellResponse(
    shell: Response,
    page: SsrPage,
    method: string,
    pathname = "/",
    origin = "https://iammatthias.com",
): Promise<Response> {
    const card = await cardImageUrl(page.head, origin);
    // a deep link's own payload, fetched with the app rather than after it
    const path = pathname.replace(/\/+$/, "") || "/";
    const routePreload =
        path === "/" ? "" : `<link rel="preload" href="/api/app/route?path=${appPathParam(path)}" as="fetch" crossorigin>`;
    const template = (await shell.text()).replace(TRUNK_RELOAD, "");
    const body =
        `<div id="ssr-root">${SITE_HEADER}<main id="ssr">${quietImages(ssrMainHtml(page))}</main></div>`;
    const rewritten = new HTMLRewriter()
        .on("html", {
            element(el) {
                el.setAttribute("lang", "en");
            },
        })
        .on("title", {
            element(el) {
                el.setInnerContent(fullTitle(page.head));
            },
        })
        .on("head", {
            element(el) {
                el.append(`${headHtml(page.head, card)}\n${SHELL_CSS}\n${appPreloads(path)}${routePreload}`, { html: true });
            },
        })
        .on("body", {
            element(el) {
                el.prepend(body, { html: true });
            },
        })
        .transform(
            new Response(template, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            }),
        );
    const html = await rewritten.text();
    // a 200's revalidation is answered 304 in index.ts
    return new Response(method === "HEAD" ? null : html, {
        status: page.status,
        headers: { "Content-Type": "text/html; charset=utf-8", ETag: await etagFor(html) },
    });
}
