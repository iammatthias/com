// The boot's retry (index.html __bootFailed), in Chrome and WebKit: other origins' failures
// never reload the page or show. A missing app file's quiet retries are boot-retry.mjs's.
//
//   bun boot.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const state = (page) =>
    page.evaluate(() => ({ canvas: !!document.querySelector("canvas"), diag: document.getElementById("diag")?.style.display === "block" })).catch(() => ({}));

async function run(kind, name, setup, expect) {
    const { browser, context, page } = await open(kind, { greeted: false });
    let loads = 0;
    page.on("framenavigated", (f) => f === page.mainFrame() && loads++);
    await setup(context);
    await page.goto(base + "/posts").catch(() => {});
    await page.waitForTimeout(8000);
    expect(await state(page), loads);
    await browser.close();
}

for (const kind of ["desktop", "phone"]) {
    await run(kind, "plain", async () => {}, (s, loads) => check(loads === 1 && s.canvas && !s.diag, `${kind}: a plain load boots once`));
    await run(
        kind,
        "beacon",
        (ctx) => ctx.route(/cloudflareinsights\.com/, (r) => r.abort("blockedbyclient")),
        (s, loads) => check(loads === 1 && s.canvas && !s.diag, `${kind}: a blocked analytics beacon doesn't reload (${loads} loads)`),
    );
    await run(
        kind,
        "foreign throw",
        async (ctx) => {
            // the beacon's own host: the one other origin the site's CSP lets run, so this is real live too
            await ctx.route(/cloudflareinsights\.com/, (r) => r.fulfill({ contentType: "text/javascript", body: 'throw new TypeError("Failed to fetch");' }));
            await ctx.addInitScript(() =>
                document.addEventListener("readystatechange", () => {
                    if (document.readyState !== "interactive") return;
                    const s = document.createElement("script");
                    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
                    document.head.append(s);
                }),
            );
        },
        (s, loads) => check(loads === 1 && s.canvas && !s.diag, `${kind}: another origin's error doesn't reload or show (${loads} loads)`),
    );
    for (const [what, body] of [
        ["rejection", 'Promise.reject(new TypeError("Failed to fetch"));'],
        ["console.error", 'console.error("beacon: Failed to fetch");'],
    ]) {
        await run(
            kind,
            `foreign ${what}`,
            async (ctx) => {
                await ctx.route(/cloudflareinsights\.com/, (r) => r.fulfill({ contentType: "text/javascript", body }));
                await ctx.addInitScript(() =>
                    document.addEventListener("readystatechange", () => {
                        if (document.readyState !== "interactive") return;
                        const s = document.createElement("script");
                        s.src = "https://static.cloudflareinsights.com/beacon.min.js";
                        document.head.append(s);
                    }),
                );
            },
            (s, loads) => check(loads === 1 && s.canvas && !s.diag, `${kind}: another origin's ${what} doesn't reload or show (${loads} loads)`),
        );
    }
}
done();
