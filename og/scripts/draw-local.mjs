// Draw every page's social card on this machine (headless Chromium, the same card page in
// WebGL2) and put the ones the og Worker doesn't have yet into its KV, so Browser Run only
// ever draws new or changed pages, on demand. Costs nothing on Cloudflare but the uploads.
//
//   bun og/scripts/draw-local.mjs [site-origin] [--dry-run]
//
// Card URLs are read from the live site (its sitemap, then each page's og:image), so the
// signatures are exactly the ones the og Worker will be asked for.

import { chromium } from "../../app/e2e/node_modules/playwright/index.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const origin = (process.argv.find((a) => a.startsWith("http")) ?? "https://iammatthias.com").replace(/\/$/, "");
const dryRun = process.argv.includes("--dry-run");
const VERSION = "v2"; // worker/src/lib/og-card.ts CARD_VERSION
const QUALITY = 72; // og/src/index.ts JPEG_QUALITY
const here = dirname(fileURLToPath(import.meta.url));
const wrangler = join(here, "../node_modules/.bin/wrangler");
const ogDir = join(here, "..");
const kv = (...args) => execFileSync(wrangler, ["kv", ...args, "--binding", "CONTENT_CACHE", "--remote", "--preview", "false"], { cwd: ogDir, encoding: "utf8", maxBuffer: 64 << 20 });

const text = async (path, accept = "text/html") => {
    const res = await fetch(origin + path, { headers: { Accept: accept } });
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    return res.text();
};

// 1. every card URL the site hands out
const sitemap = await text("/sitemap.xml", "application/xml");
const paths = ["/", ...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))];
const cards = new Map(); // sig -> card url
for (let i = 0; i < paths.length; i += 8) {
    await Promise.all(
        paths.slice(i, i + 8).map(async (p) => {
            try {
                const m = (await text(p)).match(/<meta property="og:image" content="([^"]+)"/);
                const url = m && m[1].replace(/&amp;/g, "&");
                const sig = url && url.match(/\/og\/([0-9a-f]{24})\.jpg/)?.[1];
                if (sig) cards.set(sig, url);
            } catch (err) {
                console.warn("skip", p, String(err));
            }
        }),
    );
}
console.log(`${paths.length} pages, ${cards.size} distinct cards`);

// 2. the ones not kept yet
const kept = new Set(JSON.parse(kv("key", "list", "--prefix", `og:${VERSION}:`)).map((k) => k.name));
const todo = [...cards].filter(([sig]) => !kept.has(`og:${VERSION}:${sig}`));
console.log(`${kept.size} kept, ${todo.length} to draw`);
if (dryRun || !todo.length) process.exit(0);

// 3. draw them, four at a time
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const drawn = [];
let failed = 0;
async function draw([sig, url]) {
    const u = new URL(url);
    const page = await context.newPage();
    try {
        await page.goto(`${origin}/card/card${u.search}`, { waitUntil: "load", timeout: 30000 });
        await page.waitForFunction(() => window.__cardReady || window.__cardError, null, { timeout: 30000 });
        const error = await page.evaluate(() => window.__cardError);
        if (error) throw new Error(error);
        const jpeg = await page.locator("#card").screenshot({ type: "jpeg", quality: QUALITY });
        drawn.push({ key: `og:${VERSION}:${sig}`, value: jpeg.toString("base64"), base64: true });
        if (u.searchParams.get("kind") === "home") drawn.push({ key: `og:${VERSION}:fallback`, value: jpeg.toString("base64"), base64: true });
    } catch (err) {
        failed++;
        console.warn("failed", sig, String(err).slice(0, 160));
    } finally {
        await page.close();
    }
}
for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(draw));
    process.stdout.write(`\r${Math.min(i + 4, todo.length)}/${todo.length}`);
}
await browser.close();
console.log(`\ndrawn ${drawn.length}, failed ${failed}`);

// 4. into KV, in bulk (a hundred at a time keeps each upload small)
const dir = mkdtempSync(join(tmpdir(), "og-cards-"));
for (let i = 0; i < drawn.length; i += 100) {
    const file = join(dir, `batch-${i}.json`);
    writeFileSync(file, JSON.stringify(drawn.slice(i, i + 100)));
    kv("bulk", "put", file);
    console.log(`uploaded ${Math.min(i + 100, drawn.length)}/${drawn.length}`);
}
