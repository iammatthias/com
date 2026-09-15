
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
await deck.goto(`${BASE}${docPath}`, { waitUntil: "networkidle" });
await deck.waitForTimeout(600);
const circuit = await deck.evaluate(() => {
    const root = document.querySelector("[data-deck-root]");
    const rail = document.querySelector(".deck-col--rail");
    const others = [...document.querySelectorAll("[data-deck-root] > *")]
        .filter((c) => c !== rail && getComputedStyle(c).display !== "none");
    const leftmost = others.length
        ? others.reduce((a, b) => (a.getBoundingClientRect().left <= b.getBoundingClientRect().left ? a : b))
        : null;
    const tiles = [...document.querySelectorAll(".column-tile")];
    return {
        headerHidden: getComputedStyle(document.querySelector("body > header")).display === "none",
        railOverlap: rail && leftmost ? Math.round(rail.getBoundingClientRect().right - leftmost.getBoundingClientRect().left) : null,
        visibleColumns: others.length + (rail ? 1 : 0),
        tiles: tiles.length,
        mounted: tiles.filter((t) => t.children.length > 0).length,
        scrollLeft: root?.scrollLeft ?? null,
    };
});
const deckOk = circuit.headerHidden && circuit.railOverlap === 0 && circuit.tiles > 0 && circuit.mounted === circuit.tiles && circuit.scrollLeft === 0;
if (!deckOk) failures++;
console.log(`${deckOk ? "  ok " : "FAIL "} deck shell @2560px — ${JSON.stringify(circuit)}`);
for (const [w, h] of [[390, 900], [1440, 900], [2560, 1400]]) {
    const art = await browser.newPage({ viewport: { width: w, height: h } });
    await art.goto(`${BASE}${docPath}`, { waitUntil: "networkidle" });
    await art.waitForTimeout(400);
    const meta = await art.evaluate(() => {
        const seen = (s) => { const e = document.querySelector(s); return !!(e && e.getBoundingClientRect().width > 0); };
        return {
            tagsInHero: seen(".deck-doc__hero .doc-hero__tags a"),
            relatedAtEnd: seen(".deck-doc__flow .doc-related .card"),
            colophonAtFoot: seen(".deck-doc__flow .colophon-meta"),
            tagsNotInDetails: !seen(".deck-col--meta .doc-hero__tags"),
            relatedNotInDetails: !seen(".deck-col--meta .doc-related"),
            colophonNotInDetails: !seen(".deck-col--meta .colophon"),
        };
    });
    const metaOk = Object.values(meta).every(Boolean);
    if (!metaOk) failures++;
    console.log(`${metaOk ? "  ok " : "FAIL "} article content is where it belongs @${w}px — ${JSON.stringify(meta)}`);
    const fits = await art.evaluate(() => {
        const d = document.querySelector("[data-deck-root]");
        return { deck: d.scrollWidth - d.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    const fitsOk = fits.deck === 0 && fits.doc === 0;
    if (!fitsOk) failures++;
    console.log(`${fitsOk ? "  ok " : "FAIL "} nothing scrolls sideways @${w}px — ${JSON.stringify(fits)}`);
    await art.close();
}

const SEEDS = `[...document.querySelectorAll('[data-azulejo-tile]')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.dataset.azulejoSeed || null)`;
const tilesA = await deck.evaluate(SEEDS);
await deck.reload({ waitUntil: "networkidle" });
await deck.waitForTimeout(700);
const tilesB = await deck.evaluate(SEEDS);
const handle = await deck.evaluateHandle(`[...document.querySelectorAll('[data-azulejo-tile]')].find(e => e.getBoundingClientRect().width > 0)`);
const seedBefore = await deck.evaluate((e) => e.dataset.azulejoSeed, handle);
await handle.asElement().click();
await deck.waitForTimeout(300);
const seedAfter = await deck.evaluate((e) => e.dataset.azulejoSeed, handle);
const tiles = {
    visible: tilesA.length,
    allSeeded: tilesA.every(Boolean),
    distinctInPage: new Set(tilesA).size === tilesA.length,
    freshOnLoad: tilesA.some((v, i) => v !== tilesB[i]),
    freshOnClick: seedBefore !== seedAfter,
};
const tilesOk = tiles.visible >= 1 && tiles.allSeeded && tiles.distinctInPage && tiles.freshOnLoad && tiles.freshOnClick;
if (!tilesOk) failures++;
console.log(`${tilesOk ? "  ok " : "FAIL "} azulejo tiles are live — ${JSON.stringify(tiles)}`);

const home = await browser.newPage({ viewport: { width: 2000, height: 1180 } });
await home.goto(`${BASE}/`, { waitUntil: "networkidle" });
await home.waitForTimeout(600);
const homeCols = await home.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().width) : null; };
    const hd = document.querySelector("body > header");
    return {
        headerVisible: getComputedStyle(hd).display !== "none",
        rail: !!document.querySelector(".deck-col--rail"),
        feed: r(".home-feed"),
        middle: r(".home-static"),
        lists: r(".home-lists"),
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
});
const homeOk = homeCols.headerVisible && !homeCols.rail && homeCols.middle <= 350 &&
    homeCols.feed > homeCols.middle && homeCols.lists > homeCols.middle && homeCols.sideways === 0;
if (!homeOk) failures++;
console.log(`${homeOk ? "  ok " : "FAIL "} homepage is three columns, middle capped — ${JSON.stringify(homeCols)}`);
await home.close();

const rail = await deck.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const names = [...document.querySelectorAll(".rail-list--collections .rail-name")];
    const counts = [...document.querySelectorAll(".rail-list--collections .rail-count")];
    return {
        rows: names.length,
        nameEdges: new Set(names.map((n) => Math.round(r(n).left))).size,
        countEdges: new Set(counts.map((c) => Math.round(r(c).right))).size,
        };
});
const railOk = rail.rows > 1 && rail.nameEdges === 1 && rail.countEdges === 1;
if (!railOk) failures++;
console.log(`${railOk ? "  ok " : "FAIL "} rail rows share one grid — ${JSON.stringify(rail)}`);

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
