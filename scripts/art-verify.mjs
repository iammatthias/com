import { execSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const PORT = Number(process.env.ART_PORT ?? 4398);
const OWNS_SERVER = !process.env.BASE_URL;
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const GOLDEN = new URL("./__goldens__/art.json", import.meta.url);
const WRITE = process.argv.includes("--write");
const COUNT = Number(process.env.ART_COUNT ?? 100);

const SEEDS = Array.from({ length: COUNT }, (_, i) =>
    Math.imul(i + 1, 0x9e3779b1) >>> 0,
);

function freePort() {
    try {
        execSync(`lsof -ti tcp:${PORT} | xargs kill`, { stdio: "ignore" });
    } catch {}
    for (let i = 0; i < 30; i++) {
        try {
            execSync(`lsof -ti tcp:${PORT}`, { stdio: "ignore" });
            execSync("sleep 0.5");
        } catch {
            return;
        }
    }
}

let server = null;
let browser = null;
try {
    if (OWNS_SERVER) {
        freePort();
        server = spawn("bunx", ["astro", "dev", "--port", String(PORT)], {
            stdio: "ignore",
        });
        const deadline = Date.now() + 90_000;
        let up = false;
        while (Date.now() < deadline && !up) {
            try {
                const r = await fetch(`${BASE}/internal/azulejo/1`);
                if (r.ok) up = true;
                else await new Promise((r) => setTimeout(r, 1000));
            } catch {
                await new Promise((r) => setTimeout(r, 1000));
            }
        }
        if (!up) throw new Error(`astro dev not reachable at ${BASE}`);
    }

    browser = await chromium.launch();

    const capture = async (kind, size, seeds) => {
        const ctx = await browser.newContext({
            viewport: { width: size.w, height: size.h },
            deviceScaleFactor: 1,
        });
        const page = await ctx.newPage();
        const out = {};
        for (const seed of seeds) {
            await page.goto(`${BASE}/internal/${kind}/${seed}`, {
                waitUntil: "networkidle",
            });
            const data = await page.evaluate(async () => {
                const cv = document.querySelector("canvas");
                if (!cv) return null;
                await new Promise((r) => requestAnimationFrame(() => r()));
                return cv.toDataURL("image/png");
            });
            if (!data) throw new Error(`${kind}/${seed}: no canvas rendered`);
            const png = Buffer.from(data.split(",")[1], "base64");
            if (png.length < 200) throw new Error(`${kind}/${seed}: canvas looks empty`);
            out[seed] = createHash("sha256").update(png).digest("hex").slice(0, 32);
        }
        await ctx.close();
        return out;
    };

    const actual = {
        azulejo: await capture("azulejo", { w: 192, h: 192 }, SEEDS),
        terrazzo: await capture("terrazzo", { w: 640, h: 220 }, SEEDS.slice(0, 25)),
    };

    if (WRITE || !existsSync(GOLDEN)) {
        mkdirSync(new URL("./__goldens__/", import.meta.url), { recursive: true });
        writeFileSync(GOLDEN, `${JSON.stringify(actual, null, 2)}\n`);
        const n = Object.keys(actual.azulejo).length + Object.keys(actual.terrazzo).length;
        console.log(`wrote ${n} golden hashes to scripts/__goldens__/art.json`);
        console.log("NOTE: goldens are GPU-specific. Regenerate on the same machine.");
    } else {
        const expected = JSON.parse(readFileSync(GOLDEN, "utf8"));
        let checked = 0;
        const bad = [];
        for (const kind of ["azulejo", "terrazzo"]) {
            for (const [seed, hash] of Object.entries(actual[kind])) {
                const want = expected[kind]?.[seed];
                if (want === undefined) {
                    bad.push(`${kind}/${seed}: no golden`);
                } else if (want !== hash) {
                    bad.push(`${kind}/${seed}: ${want} -> ${hash}`);
                }
                checked++;
            }
        }
        if (bad.length) {
            console.error(`\nPIXEL DRIFT — ${bad.length}/${checked} differ:\n`);
            for (const b of bad.slice(0, 20)) console.error(`  ${b}`);
            if (bad.length > 20) console.error(`  … and ${bad.length - 20} more`);
            process.exitCode = 1;
        } else {
            console.log(`art-verify: ${checked}/${checked} pixel-identical`);
        }
    }
} finally {
    if (browser) await browser.close();
    if (server) {
        server.kill("SIGTERM");
        // astro dev is spawned via bunx, so the child can outlive the wrapper
        freePort();
    }
}
