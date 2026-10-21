// Builds assets/diagrams: diagrams.js (theme, raster, and which kind a source is) and one module
// per kind of diagram, pele's core with that one kind. Each file imports nothing: a browser
// keeps a failed import for its URL, and also a failed module another one imports, so only a
// file with no imports of its own can be asked for again under a new URL and load.
//
//   bun build.ts

import { mkdirSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dir;
const out = join(here, "../assets/diagrams");
const entries = join(here, ".entries");
const kinds = readdirSync(join(here, "node_modules/pele/dist/esm/diagrams"))
    .filter((f) => f.endsWith(".js"))
    .map((f) => f.slice(0, -3));

rmSync(entries, { recursive: true, force: true });
mkdirSync(entries);
for (const kind of kinds) {
    writeFileSync(
        join(entries, `${kind}.js`),
        `import { render, register } from "pele/core";\nimport kind from "pele/diagrams/${kind}";\nregister(kind);\nexport { render };\n`,
    );
}

const built = await Bun.build({
    entrypoints: [join(here, "diagrams.js"), ...kinds.map((k) => join(entries, `${k}.js`))],
    target: "browser",
    format: "esm",
    minify: true,
    splitting: false,
    root: here,
    naming: "[name].[ext]",
});
rmSync(entries, { recursive: true, force: true });
if (!built.success) throw new AggregateError(built.logs, "diagrams: build failed");

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const file of built.outputs) {
    const code = await file.text();
    const name = file.path.split("/").pop()!;
    if (/\bimport\s*\(|\bimport\s*["'{*]|\bimport\.meta\b/.test(code)) throw new Error(`diagrams: ${name} imports another module`);
    writeFileSync(join(out, name), code);
}
copyFileSync(join(here, "node_modules/pele/LICENSE"), join(out, "LICENSE-pele.txt"));
writeFileSync(join(out, ".gitkeep"), "");
console.log(`diagrams: ${built.outputs.length} modules`);
