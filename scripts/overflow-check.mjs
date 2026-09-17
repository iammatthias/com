
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
    const cols = [...document.querySelectorAll("[data-deck-root] > *")]
        .filter((c) => getComputedStyle(c).display !== "none");
    const tiles = [...document.querySelectorAll("[data-azulejo-tile]")];
    return {
        headerVisible: getComputedStyle(document.querySelector("body > header")).display !== "none",
        rail: !!document.querySelector(".deck-col--rail"),
        columns: cols.map((c) => c.dataset.deckCol ?? "?"),
        tiles: tiles.length,
        mounted: tiles.filter((t) => t.children.length > 0).length,
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
});
const deckOk = circuit.headerVisible && !circuit.rail && circuit.columns.length >= 1 &&
    circuit.tiles > 0 && circuit.mounted === circuit.tiles && circuit.sideways === 0;
if (!deckOk) failures++;
console.log(`${deckOk ? "  ok " : "FAIL "} article shell @2560px — ${JSON.stringify(circuit)}`);
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
            relatedBelowColophon: (() => {
                const flow = document.querySelector(".deck-doc__flow");
                const rel = flow?.querySelector(".doc-related");
                const col = flow?.querySelector(".colophon");
                if (!rel || !col) return !rel;
                return !!(col.compareDocumentPosition(rel) &
                    Node.DOCUMENT_POSITION_FOLLOWING);
            })(),
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
    const scrolls = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return false;
        const cs = getComputedStyle(e);
        return cs.overflowY === "auto" && e.scrollHeight > e.clientHeight + 4;
    };
    return {
        headerVisible: getComputedStyle(hd).display !== "none",
        rail: !!document.querySelector(".deck-col--rail"),
        feed: r(".home-feed"),
        middle: r(".home-static"),
        lists: r(".home-lists"),
        pageScrolls: document.documentElement.scrollHeight > innerHeight + 4,
        feedScrolls: scrolls(".home-feed"),
        listsScroll: scrolls(".home-lists"),
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
});
const homeOk = homeCols.headerVisible && !homeCols.rail && homeCols.middle <= 350 &&
    homeCols.feed > homeCols.middle && homeCols.lists > homeCols.middle && homeCols.sideways === 0 &&
    !homeCols.pageScrolls && homeCols.feedScrolls && homeCols.listsScroll;
if (!homeOk) failures++;
console.log(`${homeOk ? "  ok " : "FAIL "} homepage is three columns, middle capped — ${JSON.stringify(homeCols)}`);
await home.close();

for (const route of ["/about", "/contact", "/privacy", "/developers", "/tags", "/posts"]) {
    const pg = await browser.newPage({ viewport: { width: 1512, height: 982 } });
    await pg.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await pg.waitForTimeout(400);
    const head = await pg.evaluate(() => {
        const h = document.querySelector(".page-header");
        const next = h && h.nextElementSibling;
        return {
            headerVisible: getComputedStyle(document.querySelector("body > header")).display !== "none",
            gap: next ? Math.round(next.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null,
        };
    });
    const headOk = head.headerVisible && head.gap !== null && head.gap >= 24;
    if (!headOk) failures++;
    console.log(`${headOk ? "  ok " : "FAIL "} ${route} page header has room — ${JSON.stringify(head)}`);
    await pg.close();
}


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
