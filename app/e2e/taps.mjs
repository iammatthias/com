// Taps on a phone: a still page takes every tap, and a tap 2.5s or more after a flick lands.
// (A tap while the page still coasts only stops it, as on iOS: not checked here.)
//
//   bun taps.mjs [base-url]

import { base, open, check, done, path } from "./lib.mjs";

const POST = "/posts/1789494942000-own-the-means-of-cognition";
const { browser, page } = await open("phone");
// a flick, as touch-type pointer events on the canvas (what gpui reads)
const fling = () =>
    page.evaluate(async () => {
        const c = document.querySelector("canvas");
        const ev = (type, y) =>
            c.dispatchEvent(new PointerEvent(type, { pointerType: "touch", pointerId: 9, isPrimary: true, clientX: 200, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
        ev("pointerdown", 650);
        for (let i = 1; i <= 6; i++) {
            ev("pointermove", 650 - i * 60);
            await new Promise((r) => setTimeout(r, 12));
        }
        ev("pointerup", 290);
    });
for (const [label, wait] of [["still", 0], ["still", 0], ["still", 0], ["2.5s after a flick", 2500], ["4s after a flick", 4000]]) {
    await page.goto(base + POST);
    await page.waitForTimeout(9000);
    if (wait) {
        await fling();
        await page.waitForTimeout(wait);
    }
    await page.touchscreen.tap(46, 37);
    await page.waitForTimeout(1500);
    check(path(page) !== POST, `"back" takes a tap, ${label}`);
}
await browser.close();
done();
