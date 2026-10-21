// A clip (dom_video) plays in the column, hides and pauses under an open panel, and plays again
// once the panel closes.
//
//   bun video.mjs [base-url]

import { base, open, check, done } from "./lib.mjs";

const POST = "/posts/1784736733544-now-playing";
const { browser, page, errors } = await open("desktop");
await page.goto(base + POST);
await page.waitForTimeout(10000);
// the overlay clip, not the server-rendered copy under #ssr-root
const clip = () =>
    page.evaluate(() => {
        const v = [...document.querySelectorAll("body > video")][0];
        return v ? { shown: getComputedStyle(v).display !== "none", playing: !v.paused } : null;
    });
for (let i = 0; i < 30 && !(await clip())?.shown; i++) {
    await page.mouse.move(640, 450);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(250);
}
// a first fetch of the clip (cold after a deploy) can take a while to have a frame to show
for (let i = 0; i < 30 && !((await clip())?.shown && (await clip())?.playing); i++) await page.waitForTimeout(500);
let s = await clip();
check(s?.shown && s?.playing, `in view, the clip shows and plays ${JSON.stringify(s)}`);
await page.mouse.click(1205, 36);
await page.waitForTimeout(1500);
s = await clip();
check(s && !s.shown && !s.playing, `under the open menu, it hides and pauses ${JSON.stringify(s)}`);
await page.mouse.click(1205, 36);
await page.waitForTimeout(2000);
s = await clip();
check(s?.shown && s?.playing, `the menu closed, it plays again ${JSON.stringify(s)}`);
check(errors.length === 0, `no errors ${errors.join(" | ")}`);
await browser.close();
done();
