
import { execSync, spawn } from "node:child_process";
import { chromium } from "playwright";

const OWNS_SERVER = !process.env.BASE_URL;
const BASE = process.env.BASE_URL ?? "http://localhost:4399";

let server = null;
if (OWNS_SERVER) {
    await new Promise((resolve) => {
        spawn("bunx", ["astro", "preview", "stop"], { stdio: "ignore" }).on(
            "exit",
            resolve,
        );
    });
    try {
        execSync("lsof -ti tcp:4399 | xargs kill", { stdio: "ignore" });
    } catch {
    }
    for (let i = 0; i < 30; i++) {
        try {
            execSync("lsof -ti tcp:4399", { stdio: "ignore" });
            await new Promise((r) => setTimeout(r, 500));
        } catch {
            break;
        }
    }
    server = spawn("bunx", ["astro", "preview", "--port", "4399"], {
        stdio: "ignore",
    });
    const deadline = Date.now() + 60_000;
    let up = false;
    while (Date.now() < deadline && !up) {
        try {
            await fetch(BASE + "/");
            up = true;
        } catch {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    if (!up) {
        server.kill("SIGTERM");
        throw new Error(`preview server not reachable at ${BASE}`);
    }
}

const browser = await chromium.launch();
let failures = 0;

async function measure(page, label) {
    const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
    }));
    const ok = sw <= cw + 1;
    if (!ok) {
        failures++;
        const culprits = await page.evaluate(() => {
            const cw = document.documentElement.clientWidth;
            return [...document.querySelectorAll("body *")]
                .filter((el) => el.getBoundingClientRect().right > cw + 1)
                .slice(0, 3)
                .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);
        });
        console.log(`FAIL  ${label} — scrollWidth ${sw} > ${cw}; culprits: ${culprits.join(", ")}`);
    } else {
        console.log(`  ok  ${label}`);
    }
}

const disc = await browser.newPage();
await disc.goto(`${BASE}/content`, { waitUntil: "domcontentloaded" });
const docPath = await disc.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .find((h) => /^\/(?!content|tags|feed|menu|resume|now|onchain)[a-z-]+\/[a-z0-9-]+$/.test(h)),
);
await disc.close();

const routes = ["/", "/about", "/now", "/feed", "/tags", "/content", "/posts", "/resume", "/developers", docPath].filter(Boolean);
for (const width of [320, 390, 430, 768, 834, 1024, 1180, 1280, 1440, 1728, 2560, 3440, 5120]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const r of routes) {
        await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(400);
        await measure(page, `${r} @${width}px`);
    }
    await page.close();
}

const LONG_WORD = "Supercalifragilistic".repeat(20);
const LONG_URL = "https://example.com/" + "path-segment/".repeat(30) + "?q=" + "x".repeat(200);
const deck = await browser.newPage({ viewport: { width: 2560, height: 1400 } });
await deck.goto(`${BASE}/`, { waitUntil: "networkidle" });
await deck.waitForTimeout(600);
const circuit = await deck.evaluate(() => {
    const root = document.querySelector("[data-deck-root]");
    const rail = document.querySelector(".deck-col--rail");
    const first = rail?.nextElementSibling;
    const tiles = [...document.querySelectorAll(".column-tile")];
    return {
        headerHidden: getComputedStyle(document.querySelector("body > header")).display === "none",
        railOverlap: rail && first ? Math.round(rail.getBoundingClientRect().right - first.getBoundingClientRect().left) : null,
        tiles: tiles.length,
        mounted: tiles.filter((t) => t.children.length > 0).length,
        scrollLeft: root?.scrollLeft ?? null,
    };
});
const deckOk = circuit.headerHidden && circuit.railOverlap === 0 && circuit.tiles > 0 && circuit.mounted === circuit.tiles && circuit.scrollLeft === 0;
if (!deckOk) failures++;
console.log(`${deckOk ? "  ok " : "FAIL "} deck shell @2560px — ${JSON.stringify(circuit)}`);
const before = await deck.evaluate(() => [...document.querySelectorAll(".deck-col--peek")].filter((c) => !c.hidden).length);
await deck.click("[data-deck-toggle]");
await deck.reload({ waitUntil: "networkidle" });
await deck.waitForTimeout(600);
const after = await deck.evaluate(() => [...document.querySelectorAll(".deck-col--peek")].filter((c) => !c.hidden).length);
const stored = await deck.evaluate(() => localStorage.getItem("deck:hidden"));
const toggleOk = before > 0 && after === before - 1 && !!stored;
if (!toggleOk) failures++;
console.log(`${toggleOk ? "  ok " : "FAIL "} column close persists across reload — ${before} → ${after}, stored=${stored}`);
await deck.evaluate(() => localStorage.clear());
await deck.close();

const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto(`${BASE}/feed`, { waitUntil: "domcontentloaded" });
await page.evaluate(({ LONG_WORD, LONG_URL }) => {
    const note = document.querySelector(".feed-note");
    if (note) {
        note.insertAdjacentHTML(
            "beforeend",
            `<p>${LONG_WORD}</p><p><a href="${LONG_URL}">${LONG_URL}</a></p><p><code>${LONG_WORD}</code></p>`,
        );
    }
    const h1 = document.querySelector("h1");
    if (h1) h1.textContent = LONG_WORD;
}, { LONG_WORD, LONG_URL });
await measure(page, "/feed + injected long tokens @390px");

if (docPath) {
    await page.goto(BASE + docPath, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ LONG_WORD, LONG_URL }) => {
        const body = document.querySelector(".doc-body");
        if (body) {
            body.insertAdjacentHTML(
                "beforeend",
                `<p>${LONG_WORD}</p><p><a href="${LONG_URL}">${LONG_URL}</a></p>` +
                `<table><tr>${"<td>wide-cell-content</td>".repeat(12)}</tr></table>`,
            );
        }
    }, { LONG_WORD, LONG_URL });
    await measure(page, `${docPath} + injected tokens/table @390px`);
}

await browser.close();
if (server) server.kill("SIGTERM");
console.log(failures === 0 ? "\nno horizontal overflow detected" : `\n${failures} overflow failures`);
process.exit(failures === 0 ? 0 : 1);
