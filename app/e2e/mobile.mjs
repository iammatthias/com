// Phone checks: emulate an iPhone (viewport, DPR, touch, mobile UA) and run the
// site's main flows with real touch input, saving a screenshot of each step.
//
//   bun mobile.mjs [chromium|webkit] [base-url]
//
// Screenshots land in ./shots/<engine>-NN-<step>.png. Console errors and page
// errors are printed; the exit code is non-zero if any were seen.

import { chromium, webkit, devices } from "playwright";

const engineName = process.argv[2] ?? "chromium";
const base = process.argv[3] ?? "http://127.0.0.1:8080";
const engine = engineName === "webkit" ? webkit : chromium;
const device = devices["iPhone 15"];

const browser = await engine.launch({
    headless: true,
    args: engineName === "chromium" ? ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-angle=swiftshader"] : [],
});
const context = await browser.newContext({ ...device });
// a returning visitor: skip the 11s greeting unless asked
if (!process.env.INTRO) {
    await context.addCookies([{ name: "burin", value: "5eed1234.1", url: base }]);
}
const page = await context.newPage();

const problems = [];
page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" || /panicked|unreachable|RefCell/.test(t)) problems.push(`[console.${m.type()}] ${t.slice(0, 300)}`);
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 400)}`));

let n = 0;
const shot = async (name) => {
    n += 1;
    const file = `shots/${engineName}-${String(n).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: file });
    console.log("shot", file);
};
const wait = (ms) => page.waitForTimeout(ms);
const { width, height } = device.viewport;

// one finger dragging from (x0,y0) to (x1,y1): real touch events where the engine allows it
async function swipe(x0, y0, x1, y1, steps = 12) {
    if (engineName === "chromium") {
        const cdp = await context.newCDPSession(page);
        const pt = (x, y) => [{ x, y, id: 1 }];
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(x0, y0) });
        for (let i = 1; i <= steps; i++) {
            const x = x0 + ((x1 - x0) * i) / steps;
            const y = y0 + ((y1 - y0) * i) / steps;
            await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(x, y) });
            await wait(16);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
        // WebKit: drive the canvas with touch-type pointer events, which is what gpui listens to
        await page.evaluate(async ([x0, y0, x1, y1, steps]) => {
            const c = document.querySelector("canvas");
            const ev = (type, x, y) =>
                c.dispatchEvent(new PointerEvent(type, { pointerType: "touch", pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
            ev("pointerdown", x0, y0);
            for (let i = 1; i <= steps; i++) {
                ev("pointermove", x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
                await new Promise((r) => setTimeout(r, 16));
            }
            ev("pointerup", x1, y1);
        }, [x0, y0, x1, y1, steps]);
    }
}

const step = process.env.STEPS ? process.env.STEPS.split(",") : null;
const want = (s) => !step || step.includes(s);

// 1. home: the plate on a phone
await page.goto(`${base}/`);
await wait(7000);
await shot("home");

// 2. the menu, top right
if (want("panel")) {
    await page.touchscreen.tap(width - 40, 34);
    await wait(900);
    await shot("panel-open");
    await page.touchscreen.tap(width - 40, 34);
    await wait(600);
    // 3. find, bottom right: open it, tap the field just above its pill, and type
    await page.touchscreen.tap(width - 40, height - 36);
    await wait(900);
    await page.touchscreen.tap(width / 2, height - 76);
    await wait(400);
    await page.keyboard.type("pizza");
    await wait(1500);
    await shot("panel-search");
    await page.touchscreen.tap(width - 40, height - 36);
    await wait(600);
}

// 4. a title on the spiral: tap somewhere in the lettered rings
if (want("tap-title")) {
    await page.touchscreen.tap(width * 0.5, height * 0.86);
    await wait(2500);
    await shot("after-plate-tap");
}

// 5. an article: frame opens, then swipe to scroll
if (want("article")) {
    await page.goto(`${base}/posts/1789494942000-own-the-means-of-cognition`);
    await wait(7000);
    await shot("article");
    // the hero image opens the lightbox
    await page.touchscreen.tap(width / 2, 300);
    await wait(2500);
    await shot("lightbox");
    await page.touchscreen.tap(width - 30, 40);
    await wait(1200);
    await swipe(width / 2, height * 0.75, width / 2, height * 0.25);
    await wait(1200);
    await shot("article-swiped");
    await swipe(width / 2, height * 0.75, width / 2, height * 0.15);
    await wait(1200);
    await shot("article-swiped-2");
}

// 6. a recipe and an art series
if (want("recipe")) {
    await page.goto(`${base}/recipes/1710031406664-pizza-dough`);
    await wait(7000);
    await shot("recipe");
}
if (want("video")) {
    await page.goto(`${base}/art/1791519648658-datamosh`);
    await wait(8000);
    await shot("datamosh");
}
if (want("series")) {
    await page.goto(`${base}/art/1781816428977-phosphene`);
    await wait(7000);
    await shot("series");
}

// 7. the plain view
if (want("plain")) {
    await page.evaluate(() => localStorage.setItem("burin.engraving", "off"));
    await page.goto(`${base}/`);
    await wait(5000);
    await shot("plain-home");
    await page.evaluate(() => localStorage.removeItem("burin.engraving"));
}

await browser.close();
if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of [...new Set(problems)].slice(0, 30)) console.log(" ", p);
    process.exit(1);
}
console.log("no console errors");
