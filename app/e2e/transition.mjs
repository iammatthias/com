import { webkit, devices } from "playwright";
const b = await webkit.launch({ headless: true });
const ctx = await b.newContext({ ...devices[process.env.DEVICE ?? "iPhone 15"] });
await ctx.addCookies([{ name: "burin", value: "5eed1234.1", url: "http://127.0.0.1:8080" }]);
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8080/");
await p.waitForTimeout(6000);
const go = (path) => p.evaluate((path) => { history.pushState(null, "", path); dispatchEvent(new PopStateEvent("popstate")); }, path);
const seq = async (name, ats) => { const t0 = Date.now(); for (const at of ats) { await p.waitForTimeout(Math.max(0, at - (Date.now() - t0))); await p.screenshot({ path: `shots/tr-${name}-${String(at).padStart(4, "0")}.png` }); } };
await go("/posts/1789494942000-own-the-means-of-cognition");
await seq("a-in", [80, 250, 450, 700, 1000, 1500]);
await go("/recipes/1710031406664-pizza-dough");
await seq("b-next", [80, 250, 450, 700, 1000]);
await p.touchscreen.tap(50, 34); // Close
await seq("c-close", [120, 350, 650, 1000, 1500]);
console.log(errs.length ? errs : "no errors");
await b.close();
