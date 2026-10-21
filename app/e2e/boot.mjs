// The boot's one quiet retry (index.html __bootFailed), in Chrome and WebKit: other origins'
// failures never reload the page, a missing app file reloads it once and then says so, and
// "Try again" recovers.
//
//   bun boot.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const state = (page) =>
    page.evaluate(() => ({ canvas: !!document.querySelector("canvas"), note: document.querySelector("#boot .note")?.textContent ?? "", diag: document.getElementById("diag")?.style.display === "block" })).catch(() => ({}));

async function run(kind, name, setup, expect) {
    const { browser, context, page } = await open(kind, { greeted: false });
    let loads = 0;
    page.on("framenavigated", (f) => f === page.mainFrame() && loads++);
    const env = (await setup(context)) ?? {};
    await page.goto(base + "/posts").catch(() => {});
    await page.waitForTimeout(8000);
    await expect(await state(page), loads, { page, env, loads: () => loads });
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
    await run(
        kind,
        "own wasm gone",
        async (ctx) => {
            const env = { gone: true };
            await ctx.route(/_bg\.wasm$/, (r) => (env.gone ? r.fulfill({ status: 404, contentType: "text/html", body: "gone" }) : r.continue()));
            return env;
        },
        async (s, loads, { page, env, loads: now }) => {
            check(loads === 2 && !s.canvas && s.note.includes("didn't load"), `${kind}: a missing app file reloads once, then says so (${loads} loads)`);
            env.gone = false;
            await page.locator("#boot button").click();
            await page.waitForTimeout(8000);
            check((await state(page)).canvas, `${kind}: "Try again" recovers (${now()} loads)`);
        },
    );
}
done();
