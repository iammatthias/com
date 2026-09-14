import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const LAYOUT_SOURCES = ["src/styles", "src/layouts", "src/components", "src/scripts"];

export function layoutFingerprint(root = process.cwd(), dirs = LAYOUT_SOURCES) {
    const hash = createHash("sha1");
    const walk = (dir) => {
        for (const name of readdirSync(dir).sort()) {
            const full = path.join(dir, name);
            if (statSync(full).isDirectory()) walk(full);
            else {
                hash.update(path.relative(root, full));
                hash.update(readFileSync(full));
            }
        }
    };
    for (const dir of dirs) walk(path.join(root, dir));
    return hash.digest("hex").slice(0, 12);
}
