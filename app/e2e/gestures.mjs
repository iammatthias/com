import { webkit, devices } from "playwright";
const b = await webkit.launch({ headless: true });
const ctx = await b.newContext({ ...devices["iPhone 15"] });
await ctx.addCookies([{ name: "burin", value: "5eed1234.1", url: "http://127.0.0.1:8080" }]);
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8080/");
await p.waitForTimeout(6000);
// still the drift so frames compare cleanly
await p.screenshot({ path: "shots/g-0-start.png" });
const fingers = (tracks, steps = 14) => p.evaluate(async ([tracks, steps]) => {
  const c = document.querySelector("canvas");
  const ev = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, { pointerType: "touch", pointerId: id, isPrimary: id === 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  tracks.forEach((t, i) => ev("pointerdown", i + 1, t[0], t[1]));
  for (let s = 1; s <= steps; s++) {
    tracks.forEach((t, i) => ev("pointermove", i + 1, t[0] + (t[2] - t[0]) * s / steps, t[1] + (t[3] - t[1]) * s / steps));
    await new Promise((r) => setTimeout(r, 16));
  }
  tracks.forEach((t, i) => ev("pointerup", i + 1, t[2], t[3]));
}, [tracks, steps]);
await fingers([[200, 400, 320, 300]]);            // drag right and up
await p.waitForTimeout(800);
await p.screenshot({ path: "shots/g-1-dragged.png" });
await fingers([[170, 330, 90, 250], [230, 330, 310, 410]]); // pinch out
await p.waitForTimeout(800);
await p.screenshot({ path: "shots/g-2-pinched.png" });
console.log(errs.length ? errs : "no errors");
await b.close();
