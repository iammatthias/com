// Frame times while a post's frame winds open: the column re-lays out each frame it grows.
// Prints p50/p95/max frame interval and long frames over the 6 s after the canvas appears.
//
//   bun frameopen.mjs [base] [cpu-throttle] [runs]

import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
const throttle = Number(process.argv[3] ?? 1);
const runs = Number(process.argv[4] ?? 3);
const post = "/posts/1789494942000-own-the-means-of-cognition";

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-webgpu", "--enable-gpu", "--use-angle=metal"] });
const all = [];
for (let r = 0; r < runs; r++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([{ name: "burin", value: "1", url: base }]);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await page.addInitScript(() => {
        window.__frames = [];
        const watch = () => {
            if (!document.querySelector("canvas")) return requestAnimationFrame(watch);
            const t0 = performance.now();
            let last = t0;
            const tick = (t) => {
                window.__frames.push([t - t0, t - last]);
                last = t;
                if (t - t0 < 6000) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(watch);
    });
    await page.goto(base + post);
    await page.waitForTimeout(12000);
    const frames = await page.evaluate(() => window.__frames.slice(1));
    if (process.env.BUCKETS) {
        const b = {};
        for (const [at, d] of frames) { const k = Math.floor(at / 500) * 500; (b[k] ??= []).push(d); }
        console.log(Object.entries(b).map(([k, v]) => `${k}:${v.length}f/max${Math.max(...v).toFixed(0)}`).join(" "));
    }
    all.push(...frames.map(([, d]) => d));
    await context.close();
}
await browser.close();
all.sort((a, b) => a - b);
const q = (p) => all[Math.min(all.length - 1, Math.floor(p * all.length))].toFixed(1);
console.log(`throttle ${throttle}x, ${all.length} frames over ${runs} runs: p50 ${q(0.5)} ms, p95 ${q(0.95)} ms, max ${all.at(-1).toFixed(1)} ms, >33ms ${all.filter((f) => f > 33.4).length}`);
