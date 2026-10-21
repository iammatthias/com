// What the checks share: the two browsers the site is held to, and a verdict that fails the run.
import { chromium, webkit, devices } from "playwright";

export const base = (process.argv.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:8080").replace(/\/$/, "");

// real-GPU Chrome (WebGPU), and WebKit as an iPhone
export async function open(kind, { greeted = true, ...options } = {}) {
    const phone = kind === "phone";
    const browser = phone
        ? await webkit.launch()
        : await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-webgpu", "--enable-gpu", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required"] });
    const context = await browser.newContext(phone ? { ...devices["iPhone 15"], ...options } : { viewport: { width: 1280, height: 800 }, ...options });
    if (greeted) await context.addCookies([{ name: "burin", value: "1", url: base }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    page.on("console", (m) => (m.type() === "error" || /panicked/.test(m.text())) && errors.push(m.text().slice(0, 200)));
    return { browser, context, page, errors };
}

const failures = [];
export function check(ok, what) {
    console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
    if (!ok) failures.push(what);
}
export function done() {
    if (failures.length) {
        console.log(`${failures.length} failed`);
        process.exit(1);
    }
}

export const focusName = (page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName);
export const path = (page) => new URL(page.url()).pathname;

/** Fail the first `n` requests matching `re` (Infinity: every one); `asked` counts them all, and
 *  `n` can be changed as the check goes. `fail` answers a cut request (default: the network drops it). */
export async function cut(context, re, n, fail = (r) => r.abort("failed")) {
    const c = { n, asked: 0 };
    await context.route(re, (r) => (++c.asked <= c.n ? fail(r) : r.continue()));
    return c;
}
