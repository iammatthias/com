// Every kind of page, on a desktop and a phone: a screenshot of each into <out>/, and any
// console errors. Run before and after a refactor and compare the folders.
//
//   bun sweep.mjs <out-dir> [base-url] [desktop|phone|both]

import { chromium, webkit, devices } from "playwright";

const out = process.argv[2] ?? "shots/sweep";
const base = process.argv[3] ?? "http://127.0.0.1:8080";
const which = process.argv[4] ?? "both";

const index = await (await fetch(`${base}/api/app/index`)).json();
const first = (section) => index.items.find((i) => i.section === section)?.href;

const ROUTES = [
    ["spiral", "/#s5eed1234"],
    ["list", "/", { list: true }],
    ["post", "/posts/1789494942000-own-the-means-of-cognition"],
    ["diagram", "/posts/1775137360175-i-got-a-common-turtle"],
    ["recipe", "/recipes/1710031406664-pizza-dough"],
    ["series", "/art/1781816428977-phosphene"],
    ["experiment", first("experiments")],
    ["feed", "/feed"],
    ["feed-post", index.feed[0]?.href],
    ["content", "/content"],
    ["content-2", "/content/page/2"],
    ["section", "/posts"],
    ["tag", "/tags/ai"],
    ["tags", "/tags"],
    ["now", "/now"],
    ["resume", "/resume"],
    ["developers", "/developers"],
    ["tuner", "/posts/1788199665000-whats-the-frequency-kenneth"],
    ["onchain", "/experiments/1791937789859-onchain-analytics"],
    ["about", "/about"],
    ["contact", "/contact"],
    ["privacy", "/privacy"],
    ["menu", "/menu"],
    ["404", "/nowhere-at-all"],
].filter(([, path]) => path);

async function run(kind) {
    const phone = kind === "phone";
    const browser = await (phone ? webkit : chromium).launch({
        args: phone ? [] : ["--enable-unsafe-webgpu", "--use-angle=swiftshader"],
    });
    const context = await browser.newContext(phone ? { ...devices["iPhone 15"] } : { viewport: { width: 1280, height: 900 } });
    await context.addCookies([{ name: "burin", value: "1", url: base }]);
    const problems = [];
    for (const [name, path, opts] of ROUTES) {
        const page = await context.newPage();
        // the 404 route answers 404 on purpose; anything else that does is a problem
        page.on("response", (r) => { if (r.status() === 404 && name !== "404") problems.push(`${name}: 404 ${r.url()}`); });
        page.on("console", (m) => {
            if (name === "404" && /status of 404/.test(m.text())) return;
            if (m.type() === "error" || /panicked/.test(m.text())) problems.push(`${name}: ${m.text().slice(0, 200)}`);
        });
        page.on("pageerror", (e) => problems.push(`${name}: ${String(e).slice(0, 200)}`));
        await page.addInitScript((list) => localStorage.setItem("burin.view", list ? "list" : "spiral"), Boolean(opts?.list));
        await page.goto(base + path);
        await page.waitForTimeout(9000);
        await page.screenshot({ path: `${out}/${kind}-${name}.png` });
        await page.close();
    }
    await browser.close();
    return problems;
}

const kinds = which === "both" ? ["desktop", "phone"] : [which];
const problems = [];
for (const k of kinds) problems.push(...(await run(k)));
console.log(`${ROUTES.length} routes × ${kinds.length}`);
if (problems.length) {
    console.log(problems.join("\n"));
    process.exit(1);
}
console.log("no console errors");
