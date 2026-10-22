// Embed the search corpus with ternlight and store it where
// /api/search-vectors.json reads it (CONTENT_CACHE, key search-vectors:v1).
// The old site did this at build time; the ~7 MB model stays out of the Worker.
//   bun scripts/build-search-vectors.ts [origin] [--remote]
// Writes to wrangler dev's local KV simulation, or with --remote to the deployed namespace
// (e.g. `bun scripts/build-search-vectors.ts https://iammatthias.com --remote`).
import { embed } from "@ternlight/base";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SEARCH_DIMS, SEARCH_MODEL } from "../src/lib/search-model";

const origin = (process.argv.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:8796").replace(/\/$/, "");

// A corpus with a Farfield fetch missing is served without an ETag (worker/src/routes/api.ts):
// nothing from it is written, so the last vectors stand until a whole corpus comes.
const res = await fetch(`${origin}/api/search-corpus.json`);
if (!res.ok) throw new Error(`search corpus: ${res.status} ${res.statusText}; nothing written`);
if (!res.headers.get("ETag")) throw new Error("search corpus: partial (no ETag); nothing written");
const { items } = (await res.json()) as { items: Array<{ cid: string; text: string }> };
if (!items?.length) throw new Error("search corpus: empty; nothing written");
const vectors: Record<string, string> = {};
for (const item of items) {
    const v = embed(item.text) as Float32Array;
    vectors[item.cid] = Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64");
}
const file = join(mkdtempSync(join(tmpdir(), "vectors-")), "vectors.json");
writeFileSync(file, JSON.stringify({ model: SEARCH_MODEL, dims: SEARCH_DIMS, vectors }));
console.log(`embedded ${items.length} items -> ${file}`);

const proc = Bun.spawnSync(
    ["./node_modules/.bin/wrangler", "kv", "key", "put", "search-vectors:v1", "--path", file, "--binding", "CONTENT_CACHE", ...(process.argv.includes("--remote") ? ["--remote", "--preview", "false"] : ["--local"])],
    { stdout: "inherit", stderr: "inherit" },
);
process.exit(proc.exitCode ?? 1);
