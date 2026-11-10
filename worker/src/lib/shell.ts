import { fullTitle, headHtml } from "./seo";
import { cardImageUrl, cardVideoUrl } from "./og-card";
import type { SsrPage } from "./ssr";
import { etagFor } from "./http";

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

function appPreloads(path: string): string {
    const index = `<link rel="preload" href="/api/app/index" as="fetch" crossorigin>`;
    return path === "/" ? `${index}<link rel="preload" href="/api/app/timeline?page=1" as="fetch" crossorigin>` : index;
}

const NOSCRIPT =
    `<noscript><p class="ssr-note">This site is drawn by an app that needs JavaScript and WebGPU or WebGL. ` +
    `Without it you are reading the plain version below; every page also has a markdown twin (add <code>.md</code>) and the whole site is indexed at <a href="/llms.txt">/llms.txt</a>.</p></noscript>`;

const SITE_HEADER =
    `<header id="ssr-header"><nav aria-label="Site"><ul><li><a href="/">home</a></li><li><a href="/menu">menu</a></li><li><a href="/content">content</a></li><li><a href="/feed">feed</a></li><li><a href="/about">about</a></li><li><a href="/developers">developers</a></li></ul></nav></header>`;

export function ssrMainHtml(page: SsrPage): string {
    return `${NOSCRIPT}${page.main}`;
}

const TRUNK_RELOAD = /<script>"use strict";\s*\(function \(\) \{\s*const address = '\{\{__TRUNK_ADDRESS__\}\}'[\s\S]*?<\/script>/;

export function quietImages(html: string): string {
    return html.replace(/<img\b([^>]*)>/g, (_, attrs: string) => {
        const rest = attrs.replace(/\s(?:loading|fetchpriority)="[^"]*"/g, "");
        return `<img loading="lazy" fetchpriority="low"${rest}>`;
    });
}

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
    const [card, video] = await Promise.all([cardImageUrl(page.head, origin), cardVideoUrl(page.head, origin)]);
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
                el.append(`${headHtml(page.head, card, video)}\n${SHELL_CSS}\n${appPreloads(path)}${routePreload}`, { html: true });
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
    return new Response(method === "HEAD" ? null : html, {
        status: page.status,
        headers: { "Content-Type": "text/html; charset=utf-8", ETag: await etagFor(html) },
    });
}
