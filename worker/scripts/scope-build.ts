// Moves a release build's code under /b/<id>/, id a hash of everything moved: the app's wasm
// and glue, dom.js and the other snippets, and the modules it loads later (diagrams, search,
// embeds). A page keeps loading the code it booted with across a deploy, since a new build
// never writes a URL an old one used, and the Worker can keep every /b/ file for a year.
// Everything else (the page, icons, fonts-v1, the card page) stays where it is.
//
//   bun scope-build.ts <dist>     prints the id

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const dist = process.argv[2];
if (!dist) throw new Error("usage: bun scope-build.ts <dist>");
const page = join(dist, "index.html");
let html = readFileSync(page, "utf8");
// trunk prints its hash without leading zeros: not always 16 digits
const glue = html.match(/\/(com-[0-9a-f]{1,16})\.js/)?.[1];
if (!glue) throw new Error("scope-build: index.html names no com-<hash>.js");
const moved = [`${glue}.js`, `${glue}_bg.wasm`, "snippets", "diagrams", "search", "embeds"];

function files(path: string): string[] {
    return statSync(path).isDirectory() ? readdirSync(path).flatMap((f) => files(join(path, f))) : [path];
}
const hash = createHash("sha256");
for (const file of moved.flatMap((m) => files(join(dist, m))).sort()) {
    hash.update(relative(dist, file)).update("\0").update(readFileSync(file)).update("\0");
}
const id = hash.digest("hex").slice(0, 16);

mkdirSync(join(dist, "b", id), { recursive: true });
for (const m of moved) renameSync(join(dist, m), join(dist, "b", id, m));
html = html.replaceAll(`/${glue}`, `/b/${id}/${glue}`).replaceAll(`"/snippets/`, `"/b/${id}/snippets/`);
const stray = html.match(/["'(]\/(?:com-[0-9a-f]{1,16}|snippets\/|diagrams\/|search\/|embeds\/)/);
if (stray) throw new Error(`scope-build: index.html still names ${stray[0]} outside /b/${id}/`);
writeFileSync(page, html);
console.log(id);
