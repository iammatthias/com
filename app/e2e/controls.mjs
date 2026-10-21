// The top-left pill: arrived on a page from elsewhere it's "home" alone; come through the site
// it's "home | back", each half its own target. Desktop and phone.
//
//   bun controls.mjs [base-url] [shot-dir]

import { base, open, check, done, path } from "./lib.mjs";

const POST = "/posts/1789494942000-own-the-means-of-cognition";
const PIZZA = "/posts/1731475962422-shitposting-towards-a-pizza-oven";
const shots = process.argv.find((a, i) => i > 1 && !a.startsWith("http"));

for (const kind of ["desktop", "phone"]) {
    const { browser, page, errors } = await open(kind);
    const tap = (x, y) => (kind === "phone" ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
    const { width, height } = page.viewportSize();
    // a page reached inside the site, from About: Find, then Enter (so back and home differ)
    const through = async () => {
        await page.goto(base + "/about");
        await page.waitForTimeout(kind === "phone" ? 11000 : 9000);
        if (kind === "phone") await tap(width - 60, height - 38);
        else await page.keyboard.press("Slash");
        await page.waitForTimeout(800);
        await page.keyboard.type("pizza", { delay: 50 });
        await page.waitForTimeout(1500);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(6000);
    };
    // the pill sits INSET from the corner; its halves are ~70px wide each
    const y = 36;

    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    if (shots) await page.screenshot({ path: `${shots}/${kind}-direct.png`, clip: { x: 0, y: 0, width: 300, height: 90 } });
    await tap(53, y);
    await page.waitForTimeout(3000);
    check(path(page) === "/", `${kind}: arrived directly, the one target goes home (${path(page)})`);

    await through();
    check(path(page) === PIZZA, `${kind}: Find took us to the post`);
    if (shots) await page.screenshot({ path: `${shots}/${kind}-through.png`, clip: { x: 0, y: 0, width: 300, height: 90 } });
    await tap(124, y);
    await page.waitForTimeout(3000);
    check(path(page) === "/about", `${kind}: come through the site, "back" (the right half) returns to where we were (${path(page)})`);

    await through();
    await tap(53, y);
    await page.waitForTimeout(3000);
    check(path(page) === "/", `${kind}: and "home" (the left half) goes home (${path(page)})`);
    check(errors.length === 0, `${kind}: no errors ${errors.join(" | ")}`);
    await browser.close();
}
done();
