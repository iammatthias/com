// A clip's figure takes the clip's own shape: the overlay <video> is drawn at the video's
// width over height, so nothing of it is cropped or letterboxed, whatever blobs knows of it.
//
//   bun video-shape.mjs [base-url] [post-path]

import { base, open, check, done } from "./lib.mjs";

const POST = process.argv[3] || "/posts/1793118574479-this-is-your-sign";
for (const [device, viewport] of [["desktop", { width: 1280, height: 800 }], ["narrow", { width: 390, height: 844 }]]) {
    const { browser, page, errors } = await open("desktop", { viewport });
    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    const clips = () =>
        page.evaluate(() =>
            [...document.querySelectorAll("body > video")]
                .filter((v) => getComputedStyle(v).display !== "none" && v.videoWidth > 0)
                .map((v) => ({
                    src: v.currentSrc.split("/").pop().slice(0, 16),
                    drawn: parseFloat(v.style.width) / parseFloat(v.style.height),
                    own: v.videoWidth / v.videoHeight,
                })),
        );
    const seen = new Map();
    for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(400);
        for (const c of await clips()) seen.set(c.src, c);
        await page.mouse.move(200, 400);
        await page.mouse.wheel(0, 500);
    }
    check(seen.size > 0, `${device}: a clip came into view`);
    for (const c of seen.values()) {
        check(
            Math.abs(c.drawn - c.own) / c.own < 0.02,
            `${device}: ${c.src} is drawn at ${c.drawn.toFixed(3)}, its own shape is ${c.own.toFixed(3)}`,
        );
    }
    check(errors.length === 0, `${device}: no errors ${errors.join(" | ")}`);
    await browser.close();
}
done();
