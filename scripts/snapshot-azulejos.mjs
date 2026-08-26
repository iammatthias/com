#!/usr/bin/env node
/**
 * Snapshot N variations of the AzulejoTile to PNG and regenerate the
 * worker-og manifest. Required because the OG worker can't run WebGL
 * directly — pre-rendered tiles give it dynamic variance per page
 * without needing a headless browser at request time.
 *
 * Usage:
 *   1) Install Playwright + Chromium once:
 *        bun add -d playwright
 *        bunx playwright install chromium
 *   2) Start the Astro dev server in another terminal:
 *        bun dev
 *   3) Run this script:
 *        bun run snapshot:azulejos
 *
 * Output:
 *   worker-og/azulejo/01.png … NN.png    — captured tiles
 *   worker-og/src/azulejos.ts            — manifest with imports + exported list
 *   public/azulejo/                      — mirror served by HeaderTile.astro
 *
 * The manifest is what worker-og/src/index.ts consumes; rebuilding it
 * is part of this script so the worker stays in sync with whatever
 * PNGs are on disk.
 */

import { chromium } from "playwright";
import { mkdir, writeFile, readdir, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "worker-og", "azulejo");
const PUBLIC_DIR = join(ROOT, "public", "azulejo");
const MANIFEST = join(ROOT, "worker-og", "src", "azulejos.ts");

const DEV_BASE_URL = process.env.SNAPSHOT_BASE_URL ?? "http://localhost:4321";
// Captured tile resolution (square). The OG worker renders the tile
// at 200px CSS width, so 192 is enough for 1.5× retina sharpness
// while keeping the bundle within Workers' 10 MB cap. 100 tiles at
// this resolution + JPEG q=78 land around 3 MB total.
const TILE_PIXELS = 192;
const COUNT = 100; // number of variations to render
const JPEG_QUALITY = 0.78;

// Seeds derived via the 32-bit golden-ratio integer hash
// (Knuth/Fibonacci). Spreads consecutive indices across the entire
// mulberry32 space so neighboring tiles never look like incremental
// variations — each one is meaningfully different from the next.
const SEEDS = Array.from({ length: COUNT }, (_, i) =>
    Math.imul(i + 1, 0x9e3779b1) >>> 0,
);

async function snapshot() {
    if (existsSync(OUT_DIR)) {
        await rm(OUT_DIR, { recursive: true, force: true });
    }
    await mkdir(OUT_DIR, { recursive: true });

    console.log(`launching headless chromium…`);
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: TILE_PIXELS, height: TILE_PIXELS },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    let saved = 0;
    for (const [index, seed] of SEEDS.entries()) {
        // 3-digit padding (001…100) keeps alphabetical sort identical
        // to numeric sort once the count crosses 99.
        const idx = String(index + 1).padStart(3, "0");
        const url = `${DEV_BASE_URL}/internal/azulejo/${seed}`;
        process.stdout.write(`  ${idx}/${COUNT}  seed=${seed}  `);

        try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
            await page.waitForSelector("canvas", { timeout: 10_000 });
            // Give the WebGL context one extra frame to render — networkidle
            // alone doesn't guarantee the shader's first paint has landed.
            await page.waitForTimeout(200);

            // Capture via canvas.toDataURL() instead of element.screenshot().
            // Playwright's element screenshot captures the locator's visible
            // *region*, which includes overlapping HTML in front of the
            // canvas (e.g. Astro's dev toolbar). toDataURL pulls the raw
            // pixel buffer straight off the canvas, so no other DOM ever
            // bleeds into the capture. JPEG q=85 keeps ~50 KB tiles.
            const dataUrl = await page.evaluate((quality) => {
                const c = document.querySelector("canvas");
                if (!c) return null;
                return c.toDataURL("image/jpeg", quality);
            }, JPEG_QUALITY);
            if (!dataUrl) throw new Error("canvas not found on page");
            const base64 = dataUrl.split(",", 2)[1];
            const buffer = Buffer.from(base64, "base64");
            const fileName = join(OUT_DIR, `${idx}.jpg`);
            await writeFile(fileName, buffer);
            saved++;
            console.log(`✓ (${(buffer.length / 1024).toFixed(1)} KB)`);
        } catch (err) {
            console.log(`✗ ${(err instanceof Error ? err.message : err)}`);
        }
    }

    await browser.close();
    console.log(`saved ${saved}/${COUNT} tiles to ${OUT_DIR}`);

    await regenerateManifest();
}

async function regenerateManifest() {
    const files = (await readdir(OUT_DIR))
        .filter((f) => /\.(png|jpe?g)$/i.test(f))
        .sort();

    const importLines = files
        .map(
            (f, i) =>
                `import t${String(i + 1).padStart(3, "0")} from "../azulejo/${f}";`,
        )
        .join("\n");
    const arrayBody = files
        .map((_, i) => `t${String(i + 1).padStart(3, "0")}`)
        .join(", ");

    const body = `/**
 * Azulejo PNG manifest. AUTO-GENERATED by scripts/snapshot-azulejos.mjs.
 * Do not edit by hand — re-run the script to refresh.
 *
 * Variations: ${files.length}
 */

${importLines}

export const AZULEJOS: (ArrayBuffer | Uint8Array)[] = [${arrayBody}];
`;

    await writeFile(MANIFEST, body);
    console.log(`wrote ${MANIFEST} (${files.length} entries)`);

    // HeaderTile serves the same tiles from public/azulejo — mirror
    // them here so a re-fire can't desync the site header from the OG
    // worker (the mirror used to be a manual copy).
    await rm(PUBLIC_DIR, { recursive: true, force: true });
    await mkdir(PUBLIC_DIR, { recursive: true });
    for (const file of files) {
        await copyFile(join(OUT_DIR, file), join(PUBLIC_DIR, file));
    }
    console.log(`mirrored ${files.length} tiles to ${PUBLIC_DIR}`);
}

snapshot().catch((err) => {
    console.error(err);
    process.exit(1);
});
