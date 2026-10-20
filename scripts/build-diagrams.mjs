import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "public/diagrams");
const manifestPath = join(root, "src/lib/diagram-bundles.json");
const require = createRequire(join(root, "package.json"));
const diagramsDir = join(dirname(require.resolve("pele/lazy")), "diagrams");

const entries = {
    detect: `export { detectType } from "pele/core";`,
    ...Object.fromEntries(
        readdirSync(diagramsDir)
            .filter((f) => f.endsWith(".js"))
            .map((f) => {
                const type = f.replace(/\.js$/, "");
                return [
                    type,
                    `import { mount, register } from "pele/core";\nimport diagram from "pele/diagrams/${type}";\nregister(diagram);\nexport { mount };`,
                ];
            }),
    ),
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const manifest = {};
for (const [name, contents] of Object.entries(entries)) {
    const result = await build({
        stdin: { contents, resolveDir: root, loader: "js" },
        bundle: true,
        minify: true,
        format: "esm",
        target: "es2022",
        write: false,
        logLevel: "error",
    });
    const code = result.outputFiles[0].text;
    if (/\bimport\s*\(|\bimport\s*["'{*]|\bimport\.meta\b/.test(code)) {
        throw new Error(`${name} bundle is not self-contained`);
    }
    const file = `${name}.${createHash("sha256").update(code).digest("hex").slice(0, 8)}.js`;
    writeFileSync(join(outDir, file), code);
    manifest[name] = `/diagrams/${file}`;
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
console.log(`diagram bundles: ${Object.keys(manifest).length} written to public/diagrams`);
