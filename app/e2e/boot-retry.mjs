// A page whose build is gone boots anyway, in Chrome and WebKit, without ever saying it failed:
// a page the browser kept from before a deploy, a deploy still landing, and a diagram whose build
// was dropped after the page booted. Only a site that's really down says so, and "Try again"
// then recovers.
//
// A proxy in front of the build stands in for the edge. It hands out the page with a
// Last-Modified that a deploy doesn't change and answers a matching If-Modified-Since with a 304,
// as the edge did for the home page, so the browser's own cache keeps the page it has.
//
//   bun boot-retry.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const LAST_MODIFIED = "Wed, 14 Oct 2026 00:18:00 GMT";
const GONE = "0000000000000000";
const OLD = "1111111111111111";
const NEW = "2222222222222222";
// what the boot screen says once it has given up
const FAILED = "The site didn't answer. The connection may have dropped.";

// the page as a build `id` names its code (null: as served). `live` is the /b/ the served page
// names, deployed; trunk serve builds none and names the build's own paths at the root.
function scoped(html, id, live) {
    if (!id) return html;
    if (live) return html.replaceAll(`/b/${live}/`, `/b/${id}/`);
    return html.replaceAll(`"/com-`, `"/b/${id}/com-`).replaceAll(`'/com-`, `'/b/${id}/com-`).replaceAll(`"/snippets/`, `"/b/${id}/snippets/`);
}

/** `site.page(n)` is the build the nth page (from 0) names; `site.gone(path, served)` is a file no build has. */
function proxy(site) {
    const served = { pages: 0, code: [], live: null };
    const server = Bun.serve({
        port: 0,
        async fetch(req) {
            const url = new URL(req.url);
            let path = url.pathname;
            if (/\.(js|wasm)$/.test(path)) served.code.push([req.method, path]);
            if (site.gone?.(path, served)) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
            path = path.replace(/^\/b\/[0-9a-f]{16}\//, served.live ? `/b/${served.live}/` : "/");
            const isPage = !/\.[a-z0-9]+$/i.test(path) && !path.startsWith("/api/") && !path.startsWith("/img/") && !path.startsWith("/.well-known/");
            if (isPage && req.headers.get("if-modified-since") === LAST_MODIFIED) return new Response(null, { status: 304, headers: { "Last-Modified": LAST_MODIFIED } });
            const upstream = await fetch(base + path + url.search, { method: req.method, headers: { accept: req.headers.get("accept") ?? "*/*" } });
            const headers = new Headers(upstream.headers);
            headers.delete("content-encoding");
            headers.delete("content-length");
            if (!isPage) return new Response(upstream.body, { status: upstream.status, headers });
            headers.set("Last-Modified", LAST_MODIFIED);
            headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
            const html = (await upstream.text()).replace(/<script>"use strict";[\s\S]*?<\/script>/, "");
            served.live ??= html.match(/\/b\/([0-9a-f]{16})\//)?.[1] ?? null;
            return new Response(scoped(html, site.page(served.pages++), served.live), { status: upstream.status, headers });
        },
    });
    return { url: `http://127.0.0.1:${server.port}`, served, stop: () => server.stop(true) };
}

const state = (page) =>
    page.evaluate(() => ({
        canvas: !!document.querySelector("canvas"),
        note: document.querySelector("#boot .note")?.textContent ?? "",
        said: sessionStorage.getItem("e2e.said") ?? "",
        diag: document.getElementById("diag")?.style.display === "block",
    })).catch(() => ({}));

async function run(kind, site, path, wait, expect) {
    const { browser, context, page } = await open(kind, { greeted: false });
    const p = proxy(site);
    await context.addCookies([{ name: "burin", value: "1", url: p.url }]);
    // whatever the boot screen says when it gives up, across every reload
    await context.addInitScript(() =>
        new MutationObserver(() => {
            const b = document.getElementById("boot");
            if (b?.classList.contains("failed")) sessionStorage.setItem("e2e.said", b.querySelector(".note").textContent);
        }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] }),
    );
    let loads = 0;
    page.on("framenavigated", (f) => f === page.mainFrame() && loads++);
    await page.goto(p.url + path).catch(() => {});
    await page.waitForTimeout(wait);
    await expect(await state(page), loads, { page, served: p.served, site, loads: () => loads });
    await browser.close();
    p.stop();
}

const isCode = (path) => /\/com-[0-9a-f]+(\.js|_bg\.wasm)$/.test(path);

for (const kind of ["desktop", "phone"]) {
    await run(kind, { page: (n) => (n === 0 ? GONE : null), gone: (p) => p.startsWith(`/b/${GONE}/`) }, "/posts", 15000, (s, loads) =>
        check(s.canvas && !s.said && !s.diag, `${kind}: a page kept from before a deploy boots, quietly (${loads} loads${s.said ? `, said "${s.said}"` : ""})`),
    );

    await run(kind, { page: () => null, gone: (p, served) => isCode(p) && served.pages <= 2 }, "/posts", 15000, (s, loads) =>
        check(s.canvas && !s.said && !s.diag, `${kind}: code a deploy hasn't landed yet boots, quietly (${loads} loads${s.said ? `, said "${s.said}"` : ""})`),
    );

    const down = { on: true };
    await run(kind, { page: () => null, gone: (p) => isCode(p) && down.on }, "/posts", 40000, async (s, loads, { page, loads: now }) => {
        check(!s.canvas && s.note === FAILED && loads === 4, `${kind}: a site that's down says so, calmly, after a few tries (${loads} loads, "${s.note}")`);
        down.on = false;
        await page.locator("#boot button").click();
        await page.waitForTimeout(10000);
        check((await state(page)).canvas, `${kind}: "Try again" recovers (${now()} loads)`);
    });

    const diagram = "/posts/1775137360175-i-got-a-common-turtle";
    await run(kind, { page: (n) => (n === 0 ? OLD : NEW), gone: (p) => p.startsWith(`/b/${OLD}/diagrams/`) }, diagram, 15000, (s, loads, { served }) => {
        const drawn = served.code.some(([m, p]) => m === "GET" && p.startsWith(`/b/${NEW}/diagrams/`));
        check(s.canvas && loads === 2 && drawn, `${kind}: a diagram whose build is gone reloads the page once, into the new build (${loads} loads)`);
    });
    await run(kind, { page: (n) => (n === 0 ? OLD : NEW), gone: (p) => p.includes("/diagrams/") }, diagram, 15000, (s, loads) =>
        check(s.canvas && loads === 2, `${kind}: and only once a session (${loads} loads)`),
    );
}
done();
