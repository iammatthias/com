import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { layoutFingerprint } from "./layout-fingerprint.mjs";

function tree() {
    const root = mkdtempSync(path.join(tmpdir(), "fp-"));
    mkdirSync(path.join(root, "src/styles"), { recursive: true });
    writeFileSync(path.join(root, "src/styles/a.css"), "a { color: red }\n");
    writeFileSync(path.join(root, "src/styles/b.css"), "b { color: blue }\n");
    return root;
}

const DIRS = ["src/styles"];

describe("layoutFingerprint", () => {
    test("is stable for an unchanged tree and independent of its location", () => {
        const a = tree();
        const b = tree();
        expect(layoutFingerprint(a, DIRS)).toBe(layoutFingerprint(a, DIRS));
        expect(layoutFingerprint(a, DIRS)).toBe(layoutFingerprint(b, DIRS));
        expect(layoutFingerprint(a, DIRS)).toMatch(/^[0-9a-f]{12}$/);
    });

    test("changes when one byte of one file changes", () => {
        const root = tree();
        const before = layoutFingerprint(root, DIRS);
        writeFileSync(path.join(root, "src/styles/a.css"), "a { color: rED }\n");
        expect(layoutFingerprint(root, DIRS)).not.toBe(before);
    });

    test("changes when a file is added or renamed, even with identical contents", () => {
        const root = tree();
        const before = layoutFingerprint(root, DIRS);
        writeFileSync(path.join(root, "src/styles/c.css"), "");
        const added = layoutFingerprint(root, DIRS);
        expect(added).not.toBe(before);
        renameSync(
            path.join(root, "src/styles/c.css"),
            path.join(root, "src/styles/d.css"),
        );
        expect(layoutFingerprint(root, DIRS)).not.toBe(added);
    });
});
