import { chromium, firefox, webkit } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const EMBEDS = [
    { tag: "ff-tuner", page: process.env.TUNER_PAGE ?? "/posts/1788199665000-whats-the-frequency-kenneth", ready: "ol li" },
    { tag: "ff-onchain-analytics", page: process.env.ANALYTICS_PAGE ?? "/experiments/1791937789859-onchain-analytics", ready: "table" },
];
const BLOB = /blobs\.farfield\.systems\/blobs\//;

const scenarios = [
    { name: "loads", failures: 0 },
    { name: "recovers after two failed fetches", failures: 2 },
    { name: "offers Try again after three, and it works", failures: 3 },
];

const results = [];
for (const [engine, type] of [["chromium", chromium], ["webkit", webkit], ["firefox", firefox]]) {
    const browser = await type.launch();
    for (const embed of EMBEDS) {
        for (const scenario of scenarios) {
            const page = await (await browser.newContext()).newPage();
            const errors = [];
            let fetches = 0;
            page.on("pageerror", (e) => errors.push(String(e)));
            await page.route(BLOB, (route) => (++fetches <= scenario.failures ? route.abort("connectionreset") : route.continue()));
            await page.goto(`${BASE}${embed.page}?z=${Date.now()}`, { waitUntil: "load" });
            await page.locator(embed.tag).scrollIntoViewIfNeeded();
            const inShadow = (selector) =>
                page
                    .waitForFunction(([tag, sel]) => document.querySelector(tag)?.shadowRoot?.querySelector(sel), [embed.tag, selector], { timeout: 20000 })
                    .then(() => true, () => false);
            let pass;
            if (scenario.failures < 3) {
                pass = (await inShadow(embed.ready)) && fetches === scenario.failures + 1;
            } else {
                const offered = await inShadow("button");
                const before = fetches;
                if (offered) await page.evaluate((tag) => [...document.querySelector(tag).shadowRoot.querySelectorAll("button")].find((b) => b.textContent === "Try again").click(), embed.tag);
                pass = offered && before === 3 && (await inShadow(embed.ready));
            }
            results.push({ engine, embed: embed.tag, scenario: scenario.name, pass: pass && errors.length === 0, fetches, errors: errors.join(" | ").slice(0, 80) });
            await page.close();
        }
    }
    await browser.close();
}

console.table(results);
if (results.some((r) => !r.pass)) process.exit(1);
