import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GLUE = "com-76947940fab458ee";
const SNIPPET = "snippets/com-2116b26e2323790f/js/dom.js";
const PAGE = `<link rel="modulepreload" href="/${GLUE}.js"><link rel="modulepreload" href="/${SNIPPET}"><link rel="preload" href="/${GLUE}_bg.wasm"><script type="module">import init from '/${GLUE}.js'; init({ module_or_path: '/${GLUE}_bg.wasm' });</script><link rel="icon" href="/favicon.svg">`;

/** A release build as trunk leaves it, with `diagram` as its flowchart module. */
function build(diagram = "export const render = 1;", page = PAGE): string {
    const dist = mkdtempSync(join(tmpdir(), "scope-build-"));
    const files: Record<string, string> = {
        "index.html": page,
        [`${GLUE}.js`]: "glue",
        [`${GLUE}_bg.wasm`]: "wasm",
        [SNIPPET]: "dom",
        "diagrams/flowchart.js": diagram,
        "search/search-worker.js": "search",
        "embeds/ff-tuner.js": "tuner",
        "favicon.svg": "<svg/>",
        "card/card.html": "card",
    };
    for (const [path, body] of Object.entries(files)) {
        mkdirSync(dirname(join(dist, path)), { recursive: true });
        writeFileSync(join(dist, path), body);
    }
    return dist;
}

function scope(dist: string) {
    const run = Bun.spawnSync(["bun", join(import.meta.dir, "../scripts/scope-build.ts"), dist]);
    return { ok: run.exitCode === 0, id: run.stdout.toString().trim(), err: run.stderr.toString() };
}

describe("scope-build", () => {
    test("moves the build's code under /b/<id>/ and points the page there; the rest stays", () => {
        const dist = build();
        const { ok, id } = scope(dist);
        expect(ok).toBe(true);
        expect(id).toMatch(/^[0-9a-f]{16}$/);
        for (const path of [`${GLUE}.js`, `${GLUE}_bg.wasm`, SNIPPET, "diagrams/flowchart.js", "search/search-worker.js", "embeds/ff-tuner.js"]) {
            expect(existsSync(join(dist, "b", id, path))).toBe(true);
            expect(existsSync(join(dist, path))).toBe(false);
        }
        expect(existsSync(join(dist, "favicon.svg")) && existsSync(join(dist, "card/card.html"))).toBe(true);
        expect(readFileSync(join(dist, "index.html"), "utf8")).toBe(PAGE.replaceAll(`/${GLUE}`, `/b/${id}/${GLUE}`).replace(`"/${SNIPPET}"`, `"/b/${id}/${SNIPPET}"`));
    });

    test("the id follows the bytes: the same build, the same id; a changed module, a new one", () => {
        const a = scope(build()).id;
        expect(scope(build()).id).toBe(a);
        expect(scope(build("export const render = 2;")).id).not.toBe(a);
    });

    test("a page naming code it can't move fails the build", () => {
        const { ok, err } = scope(build(undefined, `${PAGE}<script src="/diagrams/extra.js"></script>`));
        expect(ok).toBe(false);
        expect(err).toContain("/diagrams/");
    });
});

describe("scope-build with a short hash", () => {
    test("a glue name trunk printed without its leading zero is moved too", () => {
        const short = "com-a8362fe25d06a3f";
        const dist = build(undefined, PAGE.replaceAll(GLUE, short));
        writeFileSync(join(dist, `${short}.js`), "glue");
        writeFileSync(join(dist, `${short}_bg.wasm`), "wasm");
        const { ok, id, err } = scope(dist);
        expect(err).toBe("");
        expect(ok).toBe(true);
        expect(existsSync(join(dist, "b", id, `${short}_bg.wasm`))).toBe(true);
        expect(readFileSync(join(dist, "index.html"), "utf8")).toContain(`'/b/${id}/${short}.js'`);
    });
});
