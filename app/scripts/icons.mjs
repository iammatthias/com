// The site's icons, drawn from the plate: the home-screen and install icons are the card page's
// bare spiral (card/card.html?kind=icon) shrunk in the browser; the favicon, too small for an
// engraving to read, is the same spiral as a vector of a few bold turns.
//
//   trunk serve   (or any origin serving app/dist)
//   node scripts/icons.mjs [origin]
//
// Writes assets/icons/: icon-512.png, icon-192.png, apple-touch-icon.png (180), favicon.svg,
// favicon.ico (32 and 16).

import { chromium } from "../e2e/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const origin = (process.argv[2] ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const out = join(dirname(fileURLToPath(import.meta.url)), "../assets/icons");
const PAPER = "#F4EFE4", INK = "#1B1814";

// an Archimedean spiral from the centre out, as the plate's line runs
function spiralPath(turns, step, c) {
    const pts = [];
    for (let i = 0; i <= turns * 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r = step * (a / (Math.PI * 2)) + step * 0.15;
        pts.push(`${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`);
    }
    return "M" + pts.join(" L");
}
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<style>.bg{fill:${PAPER}}.fg{stroke:${INK}}@media (prefers-color-scheme:dark){.bg{fill:${INK}}.fg{stroke:${PAPER}}}</style>
<rect class="bg" width="32" height="32" rx="7"/>
<path class="fg" d="${spiralPath(3, 4.1, 16)}" fill="none" stroke-width="2.3" stroke-linecap="round"/>
</svg>
`;

// a PNG-in-ICO container: one directory entry per size
function ico(pngs) {
    const head = Buffer.alloc(6 + 16 * pngs.length);
    head.writeUInt16LE(1, 2);
    head.writeUInt16LE(pngs.length, 4);
    let offset = head.length;
    pngs.forEach(([size, png], i) => {
        const e = 6 + 16 * i;
        head.writeUInt8(size % 256, e);
        head.writeUInt8(size % 256, e + 1);
        head.writeUInt16LE(1, e + 4);
        head.writeUInt16LE(32, e + 6);
        head.writeUInt32LE(png.length, e + 8);
        head.writeUInt32LE(offset, e + 12);
        offset += png.length;
    });
    return Buffer.concat([head, ...pngs.map(([, png]) => png)]);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 192, height: 192 }, deviceScaleFactor: 8 })).newPage();
await page.goto(`${origin}/card/card.html?kind=icon`);
await page.waitForFunction(() => window.__cardReady || window.__cardError, null, { timeout: 30000 });
const error = await page.evaluate(() => window.__cardError);
if (error) throw new Error(`card: ${error}`);
const master = await page.locator("#card").screenshot();

// shrink in halves, then to size: one big step would alias the line away
const shrink = (src, size) =>
    page.evaluate(
        async ({ src, size }) => {
            const img = new Image();
            img.src = src;
            await img.decode();
            let c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            c.getContext("2d").drawImage(img, 0, 0);
            while (c.width / 2 >= size) {
                const h = document.createElement("canvas");
                h.width = h.height = c.width / 2;
                const g = h.getContext("2d");
                g.imageSmoothingQuality = "high";
                g.drawImage(c, 0, 0, h.width, h.height);
                c = h;
            }
            const f = document.createElement("canvas");
            f.width = f.height = size;
            const g = f.getContext("2d");
            g.imageSmoothingQuality = "high";
            g.drawImage(c, 0, 0, size, size);
            return f.toDataURL("image/png").split(",")[1];
        },
        { src, size },
    ).then((b64) => Buffer.from(b64, "base64"));

const masterUrl = `data:image/png;base64,${master.toString("base64")}`;
for (const [name, size] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]]) {
    writeFileSync(join(out, name), await shrink(masterUrl, size));
}

writeFileSync(join(out, "favicon.svg"), favicon);
await page.setViewportSize({ width: 32, height: 32 });
// the .ico has no colour scheme to follow: the light tile, always
const favUrl = `data:image/svg+xml;base64,${Buffer.from(favicon.replace(/@media[^{]*\{[^}]*}[^}]*}}/, "")).toString("base64")}`;
const raster = async (size) => {
    await page.setContent(`<img src="${favUrl}" width="${size}" height="${size}" style="display:block">`);
    await page.waitForFunction(() => document.querySelector("img").complete);
    return shrink(`data:image/png;base64,${(await page.locator("img").screenshot({ omitBackground: true })).toString("base64")}`, size);
};
writeFileSync(join(out, "favicon.ico"), ico([[32, await raster(32)], [16, await raster(16)]]));

await browser.close();
console.log(`icons written to ${out}`);
