// Memory on a phone-sized tour: wasm linear memory (it never shrinks, so this is the
// high-water mark) and the JS heap after each stop.
//
//   bun memory.mjs [chromium|webkit] [base-url]

import { chromium, webkit, devices } from "playwright";

const engineName = process.argv[2] ?? "chromium";
const base = process.argv[3] ?? "http://127.0.0.1:8080";
const engine = engineName === "webkit" ? webkit : chromium;
const browser = await engine.launch({
    headless: true,
    args: engineName === "chromium" ? ["--enable-unsafe-webgpu", "--use-angle=swiftshader", "--enable-precise-memory-info"] : [],
});
const context = await browser.newContext({ ...devices["iPhone 15"] });
await context.addCookies([{ name: "burin", value: "5eed1234.1", url: base }]);
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

const mb = (b) => (b / 1048576).toFixed(1) + "MB";
async function report(label) {
    const m = await page.evaluate(() => ({
        wasm: window.wasmBindings?.wasm_memory_bytes?.() ?? 0,
        js: performance.memory?.usedJSHeapSize ?? 0,
    }));
    console.log(label.padEnd(28), "wasm", mb(m.wasm).padStart(8), "  js", mb(m.js).padStart(8));
}

// in-app navigation, the way a reader moves: pushState + popstate
async function go(path, ms = 5000) {
    await page.evaluate((p) => {
        history.pushState(null, "", p);
        dispatchEvent(new PopStateEvent("popstate"));
    }, path);
    const step = process.env.SAMPLE ? Number(process.env.SAMPLE) : ms;
    for (let t = step; t <= ms; t += step) {
        await page.waitForTimeout(step);
        await report(`${path} +${t}ms`);
    }
}

await page.goto(`${base}/`);
await page.waitForTimeout(7000);
await report("/ (first paint)");
for (const p of process.env.TOUR ? process.env.TOUR.split(",") : [
    "/posts/1789494942000-own-the-means-of-cognition",
    "/",
    "/art/1781816428977-phosphene",
    "/feed",
    "/recipes/1710031406664-pizza-dough",
    "/art/1791519648658-datamosh",
    "/",
    "/content",
    "/",
]) {
    await go(p);
}
await browser.close();
