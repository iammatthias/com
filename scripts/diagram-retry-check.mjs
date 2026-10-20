import { chromium, firefox, webkit } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const PAGE = process.env.DIAGRAM_PAGE ?? "/posts/1784736733544-now-playing";

const scenarios = [
    { name: "loads", failFirst: 0, failAlways: false, expect: "svg" },
    { name: "recovers after two failed fetches", failFirst: 2, failAlways: false, expect: "svg" },
    { name: "keeps the source when the renderer never loads", failFirst: 0, failAlways: true, expect: "source" },
];

const results = [];
for (const [engine, type] of [["chromium", chromium], ["webkit", webkit], ["firefox", firefox]]) {
    const browser = await type.launch();
    for (const scenario of scenarios) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const requested = [];
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.route(/\/diagrams\/[^/]+\.js/, (route) => {
            const url = route.request().url();
            requested.push(new URL(url).pathname + new URL(url).search);
            const isRenderer = !url.includes("/diagrams/detect.");
            const seen = requested.filter((u) => u.split("?")[0] === new URL(url).pathname).length;
            if ((scenario.failAlways && isRenderer) || seen <= scenario.failFirst) return route.abort("connectionreset");
            return route.continue();
        });
        await page.goto(BASE + PAGE, { waitUntil: "load" });
        const state = await page
            .waitForFunction(
                (expect) => {
                    const svgs = document.querySelectorAll(".diagram-figure svg").length;
                    const sources = document.querySelectorAll("pre > code.language-mermaid").length;
                    if (expect === "svg" && svgs > 0 && sources === 0) return { svgs, sources };
                    if (expect === "source" && sources > 0 && document.querySelectorAll(".diagram-figure").length === 0) return { svgs, sources };
                    return false;
                },
                scenario.expect,
                { timeout: 15000 },
            )
            .then((h) => h.jsonValue())
            .catch(() => null);
        if (scenario.expect === "source") await page.waitForTimeout(2500);
        const settled = await page.evaluate(() => ({
            svgs: document.querySelectorAll(".diagram-figure svg").length,
            sources: document.querySelectorAll("pre > code.language-mermaid").length,
        }));
        const retried = requested.some((u) => u.includes("?retry="));
        const pass =
            state !== null &&
            errors.length === 0 &&
            (scenario.expect === "svg" ? settled.sources === 0 : settled.svgs === 0 && settled.sources > 0) &&
            (scenario.failFirst > 0 || scenario.failAlways ? retried : !retried);
        results.push({ engine, scenario: scenario.name, pass, ...settled, fetches: requested.length, errors: errors.join(" | ").slice(0, 80) });
        await context.close();
    }
    await browser.close();
}

console.table(results);
if (results.some((r) => !r.pass)) process.exit(1);
