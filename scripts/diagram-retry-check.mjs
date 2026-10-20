import { chromium, firefox, webkit } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const PAGE = process.env.DIAGRAM_PAGE ?? "/posts/1784736733544-now-playing";
const ATTEMPTS = 3;

const scenarios = [
    { name: "loads", fails: () => false, expect: "svg" },
    { name: "recovers after two failed fetches", fails: (_url, seen) => seen <= 2, expect: "svg" },
    { name: "keeps the source when the renderer never loads", fails: (url) => !url.includes("/diagrams/detect."), expect: "source" },
    { name: "keeps the source when the detector never loads", fails: (url) => url.includes("/diagrams/detect."), expect: "source" },
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
            const url = new URL(route.request().url());
            requested.push(url.pathname + url.search);
            const seen = requested.filter((u) => u.split("?")[0] === url.pathname).length;
            return scenario.fails(url.pathname, seen) ? route.abort("connectionreset") : route.continue();
        });
        await page.goto(BASE + PAGE, { waitUntil: "load" });
        const exhausted = () =>
            Object.values(Object.groupBy(requested, (u) => u.split("?")[0])).some(
                (hits) => hits.length === ATTEMPTS && scenario.fails(hits[0].split("?")[0], ATTEMPTS),
            );
        const settled = await (scenario.expect === "svg"
            ? page.waitForFunction(
                  () => document.querySelectorAll(".diagram-figure svg").length > 0 && document.querySelectorAll("pre > code.language-mermaid").length === 0,
                  null,
                  { timeout: 15000 },
              )
            : (async () => {
                  const deadline = Date.now() + 15000;
                  while (!exhausted() && Date.now() < deadline) await page.waitForTimeout(100);
                  await page.waitForTimeout(300);
              })()
        )
            .then(() => true)
            .catch(() => false);
        const state = await page.evaluate(() => ({
            svgs: document.querySelectorAll(".diagram-figure svg").length,
            sources: document.querySelectorAll("pre > code.language-mermaid").length,
        }));
        const retried = requested.some((u) => u.includes("?retry="));
        const pass =
            settled &&
            errors.length === 0 &&
            (scenario.expect === "svg"
                ? state.sources === 0 && retried === (scenario.name !== "loads")
                : exhausted() && state.svgs === 0 && state.sources > 0);
        results.push({ engine, scenario: scenario.name, pass, ...state, fetches: requested.length, errors: errors.join(" | ").slice(0, 80) });
        await context.close();
    }
    await browser.close();
}

console.table(results);
if (results.some((r) => !r.pass)) process.exit(1);
