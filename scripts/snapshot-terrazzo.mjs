#!/usr/bin/env node
/**
 * Snapshot N variations of the TerrazzoBanner to JPEG for the record
 * colophon. RecordColophon used to mount the live WebGL banner, which
 * pulled React + three.js (~195 KB gz) onto every document page for a
 * decorative strip; a pre-rendered JPEG picked by `seed % N` reads the
 * same and ships no script. Same trade HeaderTile made for azulejos.
 *
 * The banner stays content-coupled: the pages seed with
 * hashSeed(cid), so an edited record (new cid) deals a new banner.
 *
 * Usage:
 *   1) Start the Astro dev server (the /internal/terrazzo/[seed]
 *      route only exists in dev):
 *        bun dev
 *   2) Run this script (SNAPSHOT_BASE_URL overrides the default
 *      http://localhost:4321):
 *        bun run snapshot:terrazzo
 *
 * Output:
 *   public/terrazzo/001.jpg … NNN.jpg — served by RecordColophon.astro
 *
 * The banner renders with preserveDrawingBuffer: false, so this
 * captures via element screenshot (composited pixels), not
 * canvas.toDataURL like the azulejo script.
 */

import { chromium } from "playwright";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "terrazzo");

const DEV_BASE_URL = process.env.SNAPSHOT_BASE_URL ?? "http://localhost:4321";
// The dev route pins the banner at 800×160 CSS; deviceScaleFactor 2
// captures 1600×320, enough for retina in a ~450px-wide colophon cell.
const BANNER_W = 800;
const BANNER_H = 160;
const COUNT = 100; // RecordColophon picks by seed % COUNT
const JPEG_QUALITY = 80;

// Seeds derived via the 32-bit golden-ratio integer hash
// (Knuth/Fibonacci) — same spread as the azulejo set, so neighboring
// indices never look like incremental variations.
const SEEDS = Array.from({ length: COUNT }, (_, i) =>
    Math.imul(i + 1, 0x9e3779b1) >>> 0,
);

async function snapshot() {
    if (existsSync(OUT_DIR)) {
        await rm(OUT_DIR, { recursive: true, force: true });
    }
    await mkdir(OUT_DIR, { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: BANNER_W + 100, height: BANNER_H + 100 },
        deviceScaleFactor: 2,
    });

    let saved = 0;
    for (let i = 0; i < SEEDS.length; i++) {
        const seed = SEEDS[i];
        const name = String(i + 1).padStart(3, "0");
        // A fresh page per capture, with retries: each render allocates
        // a WebGL context, and headless Chromium gets flaky when they
        // accumulate; the dev server also aborts the odd navigation.
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
            const page = await context.newPage();
            try {
                // domcontentloaded, not networkidle: vite's HMR
                // websocket keeps the network "busy" forever. The
                // canvas waitFor is the real readiness signal.
                await page.goto(`${DEV_BASE_URL}/internal/terrazzo/${seed}`, {
                    waitUntil: "domcontentloaded",
                    timeout: 20_000,
                });
                const banner = page.locator("#banner");
                await banner.locator("canvas").waitFor({ timeout: 15_000 });
                // One settle frame: the ResizeObserver render is
                // rAF-debounced.
                await page.evaluate(
                    () =>
                        new Promise((r) =>
                            requestAnimationFrame(() => r(null)),
                        ),
                );
                await banner.screenshot({
                    path: join(OUT_DIR, `${name}.jpg`),
                    type: "jpeg",
                    quality: JPEG_QUALITY,
                });
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
                await new Promise((r) => setTimeout(r, 500));
            } finally {
                await page.close().catch(() => {});
            }
        }
        if (lastErr) throw lastErr;
        saved++;
        if (saved % 20 === 0) console.log(`${saved}/${COUNT}…`);
    }

    await browser.close();

    const files = await readdir(OUT_DIR);
    let total = 0;
    for (const f of files) total += (await stat(join(OUT_DIR, f))).size;
    console.log(
        `saved ${saved}/${COUNT} banners to ${OUT_DIR} (${(total / 1024 / 1024).toFixed(1)} MB)`,
    );
}

snapshot().catch((err) => {
    console.error(err);
    process.exit(1);
});
