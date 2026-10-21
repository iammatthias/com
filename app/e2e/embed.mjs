// A post with a web component (dom_embed): the element appears over the column at its own
// height, and wheel or a finger dragged over it still scrolls the page. Screenshots into <out>/.
//
//   bun embed.mjs <out-dir> [base-url] [path]

import { chromium, webkit, devices } from "playwright";

const out = process.argv[2] ?? "shots/embed";
const base = process.argv[3] ?? "http://127.0.0.1:8080";
const path = process.argv[4] ?? "/posts/1788199665000-whats-the-frequency-kenneth";
const problems = [];

for (const kind of ["desktop", "phone"]) {
    const phone = kind === "phone";
    const browser = await (phone ? webkit : chromium).launch({
        args: phone ? [] : ["--enable-unsafe-webgpu", "--use-angle=swiftshader"],
    });
    const context = await browser.newContext(phone ? { ...devices["iPhone 15"] } : { viewport: { width: 1280, height: 900 } });
    await context.addCookies([{ name: "burin", value: "1", url: base }]);
    const page = await context.newPage();
    page.on("console", (m) => m.type() === "error" && problems.push(`${kind} console: ${m.text().slice(0, 200)}`));
    page.on("pageerror", (e) => problems.push(`${kind} pageerror: ${String(e).slice(0, 200)}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`${kind} ${r.status()} ${r.url()}`));
    await page.goto(base + path);
    await page.waitForTimeout(9000);
    const host = () =>
        page.evaluate(() => {
            const h = document.querySelector("body > div[style*='will-change']");
            if (!h) return null;
            const r = h.getBoundingClientRect();
            return { shown: h.style.visibility === "visible", top: Math.round(r.top), height: Math.round(r.height), tag: h.firstElementChild?.tagName };
        });
    const { width, height } = page.viewportSize();
    // one finger dragging at x, as touch-type pointer events (what gpui reads; WebKit can't
    // synthesize real touches) sent to whatever is under the finger, the component included
    const swipe = (x, y0, y1) =>
        page.evaluate(async ([x, y0, y1]) => {
            const target = document.elementFromPoint(x, y0) ?? document.querySelector("canvas");
            const ev = (type, y) =>
                target.dispatchEvent(new PointerEvent(type, { pointerType: "touch", pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true, composed: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
            ev("pointerdown", y0);
            for (let i = 1; i <= 12; i++) {
                ev("pointermove", y0 + ((y1 - y0) * i) / 12);
                await new Promise((r) => setTimeout(r, 16));
            }
            ev("pointerup", y1);
        }, [x, y0, y1]);
    const scroll = async (x, y, dy) => (phone ? swipe(x, y, y - dy) : (await page.mouse.move(x, y), page.mouse.wheel(0, dy)));

    const first = await host();
    console.log(kind, "on arrival", JSON.stringify(first));
    // down until the component is in view
    for (let i = 0; i < 160; i++) {
        const h = await host();
        if (h && h.top < height * 0.6) {
            if (h.top > 0) break;
            await scroll(width / 2, height * 0.3, -60); // past it: back a little
        } else {
            await scroll(width / 2, height * 0.7, h && h.top < height * 1.5 ? 80 : 300);
        }
        await page.waitForTimeout(phone ? 700 : 150);
    }
    await page.waitForTimeout(2500);
    const at = await host();
    console.log(kind, "in view", JSON.stringify(at));
    if (first && at && Math.abs(first.height - at.height) > 2) console.log(kind, `column room changed ${first.height} → ${at.height} after arrival`);
    await page.screenshot({ path: `${out}/${kind}-in-view.png` });
    if (!at?.shown) {
        problems.push(`${kind}: component never shown`);
    } else {
        // scroll with the pointer over the component itself
        const y = Math.min(Math.max(at.top + 30, 40), height - 40);
        await scroll(width / 2, y, phone ? 60 : 200);
        await page.waitForTimeout(800);
        const after = await host();
        console.log(kind, "after scrolling over it", JSON.stringify(after), await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [width / 2, y]));
        if (!after || after.top > at.top - 30) problems.push(`${kind}: scrolling over the component didn't move the page (${at.top} → ${after?.top})`);
        await page.screenshot({ path: `${out}/${kind}-over.png` });
    }
    await browser.close();
}
if (problems.length) {
    console.log(problems.join("\n"));
    process.exit(1);
}
console.log("ok");
