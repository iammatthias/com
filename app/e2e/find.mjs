// Find: the native input takes the keyboard (from its pill on a phone, from "/" anywhere on a
// desktop), Enter opens the first result, and closing hands the keys back to gpui.
//
//   bun find.mjs [base-url]

import { base, open, check, done, focusName, path } from "./lib.mjs";

const POST = "/posts/1789494942000-own-the-means-of-cognition";
const PIZZA = "/posts/1731475962422-shitposting-towards-a-pizza-oven";

{
    const { browser, page, errors } = await open("desktop");
    await page.goto(base + POST);
    await page.waitForTimeout(9000);
    check((await focusName(page)) === "TEXTAREA", "desktop: gpui holds the keys on arrival");
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    check((await focusName(page)) === "Find a title", 'desktop: "/" focuses Find');
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    // the plate beside the column: the middle of a post may be a figure, which opens its lightbox
    await page.mouse.click(120, 400);
    await page.waitForTimeout(300);
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    check((await focusName(page)) === "Find a title", 'desktop: "/" focuses Find after closing it');
    await page.keyboard.type("pizza", { delay: 60 });
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("piz", { delay: 40 });
    await page.waitForTimeout(600);
    check((await page.evaluate(() => document.querySelector("input[aria-label='Find a title']")?.value)) === "piz", "desktop: select-all replaces the query");
    await page.keyboard.type("za", { delay: 40 });
    await page.waitForTimeout(1200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);
    check(path(page) === PIZZA, `desktop: Enter opens the first result (${path(page)})`);
    check(errors.length === 0, `desktop: no errors ${errors.join(" | ")}`);
    await browser.close();
}
{
    // the lightbox is a modal over everything, the Find panel's input included
    const { browser, page, errors } = await open("desktop");
    const field = () => page.evaluate(() => {
        const el = document.querySelector("input[aria-label='Find a title']");
        return el ? { visible: getComputedStyle(el).opacity !== "0", focused: document.activeElement === el } : { visible: false, focused: false };
    });
    await page.goto(base + "/art/1791519648658-datamosh");
    await page.waitForTimeout(9000);
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    check((await field()).visible, "lightbox: Find's field is up before");
    await page.mouse.click(466, 500);
    await page.waitForTimeout(1200);
    check(!(await field()).visible, "lightbox: opening it over Find hides the field");
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    const f = await field();
    check(!f.visible && !f.focused, `lightbox: "/" inside it doesn't bring Find up ${JSON.stringify(f)}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    check((await field()).visible, "lightbox: closing it brings Find's field back");
    check(errors.length === 0, `lightbox: no errors ${errors.join(" | ")}`);
    await browser.close();
}
{
    const { browser, page, errors } = await open("phone");
    await page.goto(base + "/");
    await page.waitForTimeout(12000);
    const { width, height } = page.viewportSize();
    await page.touchscreen.tap(width - 60, height - 38);
    await page.waitForTimeout(1000);
    check((await focusName(page)) === "Find a title", "phone: tapping the find pill focuses the field");
    await page.keyboard.type("pizza", { delay: 50 });
    await page.waitForTimeout(1500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);
    check(path(page) === PIZZA, `phone: Enter opens the first result (${path(page)})`);
    check(errors.length === 0, `phone: no errors ${errors.join(" | ")}`);
    await browser.close();
}
done();

