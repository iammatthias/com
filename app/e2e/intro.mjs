import { webkit, devices } from "playwright";
const b = await webkit.launch({ headless: true });
const ctx = await b.newContext({ ...devices["iPhone 15"] });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
await p.goto("http://127.0.0.1:8080/");
const t0 = Date.now();
for (const at of [2.5, 4.2, 5.5, 6.6, 7.8, 9.5, 12.5]) {
  await p.waitForTimeout(Math.max(0, at * 1000 - (Date.now() - t0)));
  await p.screenshot({ path: `shots/intro-${String(at).replace(".", "_")}.png` });
}
console.log(errs.length ? errs.slice(0, 5) : "no errors");
await b.close();
