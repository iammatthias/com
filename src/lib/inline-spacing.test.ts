import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function astroFiles(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) astroFiles(p, out);
        else if (p.endsWith(".astro")) out.push(p);
    }
    return out;
}

const SRC = new URL("../", import.meta.url).pathname;
const INLINE = /^<(a|em|strong|code|span|time|abbr|b|i)\b/;

function collapsedLines(lines: string[]): number[] {
    const found: number[] = [];
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const next = lines[i + 1].trimStart();
        if (!INLINE.test(next)) continue;
        if (/[A-Za-z0-9,.;:!?)]\s*$/.test(line) && !line.trimEnd().endsWith(">")) found.push(i);
    }
    return found;
}

function collapsedSpaces(): string[] {
    const found: string[] = [];
    for (const file of astroFiles(SRC)) {
        const lines = readFileSync(file, "utf8").split("\n");
        for (const i of collapsedLines(lines)) {
            found.push(`${file.slice(SRC.length)}:${i + 1} "${lines[i].trim().slice(-40)}" ⏎ "${lines[i + 1].trimStart().slice(0, 30)}"`);
        }
    }
    return found;
}

describe("inline elements keep their spaces through compressHTML", () => {
    test("no prose line ends mid-sentence with an inline tag on the next line", () => {
        expect(collapsedSpaces()).toEqual([]);
    });

    test("the detector actually recognises the shape it is guarding against", () => {
        const broken = ['<p>', '    Try the homepage, browse', '    <a href="/content">all content</a>', '</p>'];
        expect(collapsedLines(broken)).toEqual([1]);
        const safe = ['<p>', '    Try the homepage, browse{" "}', '    <a href="/content">all content</a>', '</p>'];
        expect(collapsedLines(safe)).toEqual([]);
    });
});
