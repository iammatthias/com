// Leaving a post with a web component in-app: while the next page loads, the post still showing
// keeps its element (not removed and reloaded); once the next page is in, the element is gone.
//
//   bun embed-nav.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const POST = "/posts/1788199665000-whats-the-frequency-kenneth";
const NEXT = "/posts/1789494942000-own-the-means-of-cognition";

for (const kind of ["desktop", "phone"]) {
    const { browser, page, errors } = await open(kind);
    await page.goto(base + POST);
    await page.waitForTimeout(9000);
    const tuner = () =>
        page.evaluate(() => {
            const all = [...document.querySelectorAll("ff-tuner")];
            const el = all[0];
            return {
                count: all.length,
                same: !!el?.__marked,
                height: el ? Math.round(el.parentElement.getBoundingClientRect().height) : 0,
            };
        });
    const before = await tuner();
    check(before.count === 1 && before.height > 0, `${kind}: the tuner is placed on arrival (${JSON.stringify(before)})`);
    await page.evaluate(() => {
        document.querySelector("ff-tuner").__marked = true;
    });

    // hold the next page's payload, so the post stays up while it loads
    let release;
    let intercepted = 0;
    const held = new Promise((r) => (release = r));
    await page.route((url) => url.pathname === "/api/app/route", async (route) => {
        intercepted++;
        await held;
        await route.continue();
    });
    await page.evaluate((p) => {
        history.pushState(null, "", p);
        dispatchEvent(new PopStateEvent("popstate"));
    }, NEXT);
    await page.waitForTimeout(1500);
    const loading = await tuner();
    check(loading.count === 1 && loading.same, `${kind}: while the next page loads, the post keeps its own tuner element (${JSON.stringify(loading)})`);

    check(intercepted >= 1, `${kind}: the next page's payload was held (${intercepted})`);
    release();
    await page.waitForTimeout(4000);
    const after = await tuner();
    check(after.count === 0, `${kind}: once the next page is in, the tuner is gone (${JSON.stringify(after)})`);

    // the same, when the next page fails to load
    await page.unroute((url) => url.pathname === "/api/app/route");
    await page.goto(base + POST);
    await page.waitForTimeout(9000);
    check((await tuner()).count === 1, `${kind}: the tuner is placed again`);
    await page.route((url) => url.pathname === "/api/app/route", (route) => route.fulfill({ status: 500, body: "" }));
    await page.evaluate((p) => {
        history.pushState(null, "", p);
        dispatchEvent(new PopStateEvent("popstate"));
    }, NEXT);
    await page.waitForTimeout(4000);
    const failed = await tuner();
    check(failed.count === 0, `${kind}: under a page that would not load, the tuner is gone (${JSON.stringify(failed)})`);
    errors.splice(0, errors.length, ...errors.filter((e) => !/500/.test(e)));
    check(errors.length === 0, `${kind}: no console errors (${errors.join(" | ")})`);
    await browser.close();
}
done();
