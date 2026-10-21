// A deployed page loads only its own build's code (/b/<id>/, worker/scripts/scope-build.ts), so
// a deploy while it's open can't hand it another build's: every script, wasm and worker it asks
// for, through boot, a diagram and a search, is under the /b/<id>/ its page names. Only
// trunk serve (port 8080), which builds no /b/, is let off.
//
//   bun skew.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const { browser, context, page } = await open("desktop");
const code = [];
context.on("request", (r) => {
    const { origin, pathname } = new URL(r.url());
    // /cdn-cgi/ is Cloudflare's own, not the site's
    if (origin === new URL(base).origin && !pathname.startsWith("/cdn-cgi/") && /\.(js|mjs|wasm)$/.test(pathname)) code.push(pathname);
});
await page.goto(base + "/posts/1775137360175-i-got-a-common-turtle");
const id = (await page.content()).match(/\/b\/([0-9a-f]{16})\//)?.[1];
for (let i = 0; i < 30 && !code.some((p) => p.endsWith("/flowchart.js")); i++) await page.waitForTimeout(500);
await page.keyboard.press("Slash");
await page.keyboard.type("turtle", { delay: 40 });
for (let i = 0; i < 30 && !code.some((p) => p.endsWith("/search-worker.js")); i++) await page.waitForTimeout(500);
await browser.close();

if (!id && new URL(base).port === "8080") {
    console.log(`skip: ${base} is trunk serve, which builds no /b/`);
} else {
    check(!!id, "the page names its build's /b/<id>/");
    const outside = code.filter((p) => !p.startsWith(`/b/${id}/`));
    check(code.some((p) => p.endsWith("/flowchart.js")) && code.some((p) => p.endsWith("/search-worker.js")), `the page loaded a diagram and search (${code.length} code requests)`);
    check(outside.length === 0, `every one from its own build /b/${id}/ ${JSON.stringify(outside)}`);
}
done();
