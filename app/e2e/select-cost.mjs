// What a selection drag costs on the longest essay, against scrolling: Page::render time per re-render
// (from the #perf log) and the frame interval (requestAnimationFrame) over a 3 s drag, versus
// the same 3 s of scrolling. Not in the gate: a number to read, not a check.
//
//   bun select-cost.mjs [base-url]
import { base, open } from "./lib.mjs";

const POST = "/posts/1788199665000-whats-the-frequency-kenneth";
const pct = (xs, p) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN;
};
const summary = (name, xs) => console.log(`${name}: n=${xs.length} p50=${pct(xs, 0.5).toFixed(2)} p95=${pct(xs, 0.95).toFixed(2)} max=${Math.max(...xs).toFixed(2)}`);

const { browser, page } = await open("desktop");
let renders = [];
page.on("console", (m) => {
    const t = m.text().match(/page render ([\d.]+)ms/);
    if (t) renders.push(parseFloat(t[1]));
});
await page.goto(base + POST + "#perf");
await page.waitForTimeout(8000);
await page.mouse.move(640, 400);
await page.mouse.wheel(0, 520);
await page.waitForTimeout(1500);

const frames = async (f) => {
    await page.evaluate(() => {
        window.__frames = [];
        let last = performance.now();
        const tick = (t) => {
            window.__frames.push(t - last);
            last = t;
            if (window.__run) requestAnimationFrame(tick);
        };
        window.__run = true;
        requestAnimationFrame(tick);
    });
    await f();
    return page.evaluate(() => {
        window.__run = false;
        return window.__frames;
    });
};

// 3 s of drag at pointer-move rate: 180 moves 16 ms apart, sweeping down and back
renders = [];
const dragFrames = await frames(async () => {
    await page.mouse.move(400, 250);
    await page.mouse.down();
    const t0 = Date.now();
    let i = 0;
    while (Date.now() - t0 < 3000) {
        const k = i++ % 60;
        await page.mouse.move(420 + (k % 7) * 40, 250 + (k < 30 ? k : 60 - k) * 12);
        await page.waitForTimeout(16);
    }
    await page.mouse.up();
});
const dragRenders = renders;
summary("drag: Page::render ms per re-render", dragRenders);
summary("drag: frame interval ms", dragFrames);
console.log(`drag: ${dragRenders.length} re-renders in 3 s`);

// the same 3 s scrolling, for scale
await page.mouse.click(270, 400);
await page.waitForTimeout(300);
renders = [];
const scrollFrames = await frames(async () => {
    const t0 = Date.now();
    let dir = 1;
    while (Date.now() - t0 < 3000) {
        await page.mouse.wheel(0, 40 * dir);
        if (Math.random() < 0.05) dir = -dir;
        await page.waitForTimeout(16);
    }
});
summary("scroll: Page::render ms per re-render", renders);
summary("scroll: frame interval ms", scrollFrames);
console.log(`scroll: ${renders.length} re-renders in 3 s`);
await browser.close();
