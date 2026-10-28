// Every entry's own social loop: its card (title, section, seed) over the flowing plate, drawn by
// og-loop.ts, stored in Farfield's blobs, and named in the site's KV as ogv:v1:<sig> → cid. The
// Worker serves it at /og-video/v1/<sig>.mp4, the address each entry's og:video names, and sends
// the shared loop for an entry not drawn yet. A loop is an ~70 s render, too slow to draw when a
// link is first shared, so they are drawn here, ahead of time.
//
//   bun scripts/og-entries.ts [--site https://iammatthias.com] [--jobs 3] [--only <path>] [--dry]
//                             [--keep <dir>] [--draw-only]
//
// Which entries, and their cards, come from the live site: each page in the sitemap but the tag
// pages, and the sig and card query in its og:image, so a loop matches its card by construction.
// What KV names already is skipped: run it again after publishing and only new or edited entries
// (their card, so their sig, changed) are drawn. A loop whose seam doesn't pass isn't stored.
// Drawn loops are kept in --keep (default .og-loops/) as <sig>.mp4, so a rerun never draws one
// twice; --draw-only stops there. Each is pinned in blobs under its KV key as it is stored. Storing
// needs blobs with pins (POST /blobs?pin=), BLOBS_WRITE_KEY (a blobs key with write scope) in
// the environment or worker/.dev.vars, and wrangler logged in; drawing needs what og-loop.ts needs.

import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const worker = resolve(app, "../worker");
// the site's CONTENT_CACHE (worker/wrangler.toml)
const NAMESPACE = "54d1e62d078b4fb88d5434f77ef5c21a";
const PREFIX = "ogv:v1:";
const BLOBS = "https://blobs.farfield.systems/blobs";
const UA = "iammatthias.com og-entries (+https://iammatthias.com)";

function flag(name: string, fallback: string): string {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const site = flag("site", "https://iammatthias.com").replace(/\/$/, "");
const jobs = Number(flag("jobs", "3"));
const only = flag("only", "");
const dry = process.argv.includes("--dry");
const drawOnly = process.argv.includes("--draw-only");
const keepDir = resolve(app, flag("keep", ".og-loops"));
mkdirSync(keepDir, { recursive: true });

// one run at a time (scripts/og-entries.plist starts one hourly): a run still drawing keeps the lock
const lock = join(keepDir, ".lock");
const holder = existsSync(lock) ? Number(readFileSync(lock, "utf8")) : 0;
if (holder && holder !== process.pid && running(holder)) {
    console.log(`another run (pid ${holder}) is still going`);
    process.exit(0);
}
writeFileSync(lock, String(process.pid));
process.on("exit", () => rmSync(lock, { force: true }));
function running(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function writeKey(): string {
    if (process.env.BLOBS_WRITE_KEY) return process.env.BLOBS_WRITE_KEY;
    const vars = existsSync(join(worker, ".dev.vars")) ? readFileSync(join(worker, ".dev.vars"), "utf8") : "";
    const key = vars.match(/^BLOBS_WRITE_KEY\s*=\s*"?([^"\n]+)"?/m)?.[1];
    if (!key) throw new Error("no BLOBS_WRITE_KEY in the environment or worker/.dev.vars: a blobs key with write scope");
    return key;
}
const key = drawOnly || dry ? "" : writeKey();

function wrangler(args: string[]): string {
    const p = Bun.spawnSync(["./node_modules/.bin/wrangler", ...args], { cwd: worker, stdout: "pipe", stderr: "pipe" });
    if (p.exitCode !== 0) throw new Error(`wrangler ${args[0]} ${args[1]} failed:\n${p.stderr.toString()}`);
    return p.stdout.toString();
}

type Entry = { path: string; sig: string; query: URLSearchParams };

async function entry(path: string): Promise<Entry | null> {
    const html = await (await fetch(site + path)).text();
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
    const m = image && new URL(image).pathname.match(/^\/og\/([0-9a-f]{24})\.jpg$/);
    if (!image || !m) return null;
    const query = new URL(image).searchParams;
    return query.get("kind") === "page" ? { path, sig: m[1], query } : null;
}

const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .filter((p) => (only ? p === only : !p.startsWith("/tags")));
const entries: Entry[] = [];
for (const path of paths) {
    const e = await entry(path);
    if (e) entries.push(e);
}
const named = drawOnly
    ? new Set<string>()
    : new Set((JSON.parse(wrangler(["kv", "key", "list", "--namespace-id", NAMESPACE, "--remote", "--prefix", PREFIX])) as { name: string }[]).map((k) => k.name));
const missing = entries.filter((e) => !named.has(PREFIX + e.sig));
const drawn = (e: Entry) => join(keepDir, `${e.sig}.mp4`);
console.log(`${entries.length} entries: ${entries.length - missing.length} stored, ${missing.length} to store, ${missing.filter((e) => !existsSync(drawn(e))).length} of them to draw`);
if (dry) {
    for (const e of missing) console.log(`  ${e.path} ${e.sig}${existsSync(drawn(e)) ? " (drawn)" : ""}`);
    process.exit(0);
}

async function draw(e: Entry): Promise<boolean> {
    if (existsSync(drawn(e))) return true;
    const work = mkdtempSync(join(tmpdir(), "og-entry-"));
    const query = new URLSearchParams(e.query);
    const seed = query.get("seed") ?? "0";
    query.delete("seed");
    const out = join(work, "loop.mp4");
    const started = Date.now();
    const p = Bun.spawn(["bun", "scripts/og-loop.ts", "--card", query.toString(), "--seed", seed, "--out", out, "--work", work], {
        cwd: app,
        stdout: "pipe",
        stderr: "pipe",
    });
    const [log, code] = await Promise.all([new Response(p.stdout).text(), p.exited]);
    const ok = code === 0;
    if (ok) copyFileSync(out, drawn(e));
    const seam = log.trim().split("\n").at(-1) ?? "";
    console.log(ok ? `drew ${e.path}: ${(Bun.file(out).size / 1e6).toFixed(2)} MB in ${Math.round((Date.now() - started) / 1000)} s` : `FAIL ${e.path}: ${seam || (await new Response(p.stderr).text()).slice(-300)}`);
    rmSync(work, { recursive: true, force: true });
    return ok;
}

// Four tries, waiting longer each time: blobs and wrangler both drop the odd call (a reset
// connection, a 5xx, wranglers side by side tripping on one another's login refresh). Every step
// is safe to repeat: the same bytes are the same cid, pinning and naming are idempotent.
async function tried<T>(what: string, step: () => Promise<T> | T): Promise<T> {
    for (let tries = 1; ; tries++) {
        try {
            return await step();
        } catch (err) {
            if (tries === 4) throw new Error(`${what}: ${String(err).slice(0, 200)}`);
            await Bun.sleep(5000 * tries);
        }
    }
}

// pinned under its KV key as it's stored, so blobs' hygiene counts it used and "Delete unused"
// passes it over; a blobs without pins answers without "pin", and then nothing is named
async function store(e: Entry): Promise<void> {
    const label = PREFIX + e.sig;
    const meta = await tried("blobs", async () => {
        const res = await fetch(`${BLOBS}?pin=${encodeURIComponent(label)}`, {
            method: "POST",
            headers: { "X-API-Key": key, "Content-Type": "video/mp4", "User-Agent": UA },
            body: Bun.file(drawn(e)),
        });
        if (res.status >= 500) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
        return { status: res.status, body: (await res.text()).slice(0, 2000) };
    });
    const got = meta.status === 201 || meta.status === 200 ? (JSON.parse(meta.body) as { cid?: string; mime?: string; pin?: string }) : null;
    if (!got?.cid || !got.mime?.startsWith("video/") || got.pin !== label) throw new Error(`blobs answered ${meta.status} ${meta.body.slice(0, 200)}`);
    await tried(`stored as ${got.cid}, but not named in KV`, () => wrangler(["kv", "key", "put", "--namespace-id", NAMESPACE, "--remote", label, got.cid!]));
    console.log(`stored ${e.path} ${e.sig} → ${got.cid}`);
}

const failed: string[] = [];
const queue = [...missing];
await Promise.all(
    Array.from({ length: jobs }, async () => {
        for (let e = queue.shift(); e; e = queue.shift()) {
            try {
                if (!(await draw(e))) failed.push(e.path);
                else if (!drawOnly) await store(e);
            } catch (err) {
                failed.push(e.path);
                console.log(`FAIL ${e.path}: ${String(err).slice(0, 300)}`);
            }
        }
    }),
);
console.log(failed.length ? `${failed.length} not done: ${failed.join(" ")}` : drawOnly ? "every entry drawn" : "every entry stored");
process.exit(failed.length ? 1 : 0);
