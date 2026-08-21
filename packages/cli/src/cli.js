#!/usr/bin/env node
// iammatthias — a terminal reader for iammatthias.com.
//
//   iammatthias                     browse interactively
//   iammatthias search <terms>      ranked search
//   iammatthias read <path|slug>    render one document
//   iammatthias list [section]      list documents
//   iammatthias sections            list publications
//   iammatthias random              read something at random
//
// No dependencies and no build step: ANSI escapes and readline are
// enough for a reader, and a zero-dependency CLI installs instantly
// with npx.

import readline from "node:readline";
import { stdin, stdout } from "node:process";
import {
    search,
    listContent,
    listSections,
    getDocument,
    SiteError,
    ORIGIN,
} from "./index.js";

const C = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    italic: "\x1b[3m",
    blue: "\x1b[38;5;68m",
    sand: "\x1b[38;5;180m",
    green: "\x1b[38;5;108m",
    red: "\x1b[38;5;167m",
};
const supportsColor = stdout.isTTY && process.env.NO_COLOR === undefined;
const c = new Proxy(C, {
    get: (t, k) => (supportsColor ? (t[k] ?? "") : ""),
});

const width = () => Math.min(stdout.columns || 80, 90);

function wrap(text, indent = 0) {
    const max = width() - indent;
    const pad = " ".repeat(indent);
    const out = [];
    for (const para of text.split("\n")) {
        if (!para.trim()) {
            out.push("");
            continue;
        }
        let line = "";
        for (const word of para.split(/\s+/)) {
            if ((line + " " + word).trim().length > max) {
                out.push(pad + line.trim());
                line = word;
            } else {
                line += " " + word;
            }
        }
        if (line.trim()) out.push(pad + line.trim());
    }
    return out.join("\n");
}

/** Render markdown for a terminal: headings, emphasis, code, links. */
function renderMarkdown(md) {
    const [, frontMatter, body] = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [
        null,
        "",
        md,
    ];
    const meta = {};
    for (const line of frontMatter.split("\n")) {
        const m = /^(\w+):\s*(.*)$/.exec(line);
        if (m) meta[m[1]] = m[2].replace(/^"|"$/g, "");
    }

    const out = [];
    if (meta.title) out.push(`\n${c.bold}${c.sand}${meta.title}${c.reset}`);
    const dateline = [meta.section, meta.created?.slice(0, 10)]
        .filter(Boolean)
        .join(" · ");
    if (dateline) out.push(`${c.dim}${dateline}${c.reset}`);
    if (meta.html) out.push(`${c.dim}${meta.html}${c.reset}`);
    out.push("");

    let inCode = false;
    for (const raw of body.split("\n")) {
        if (/^```/.test(raw)) {
            inCode = !inCode;
            out.push(`${c.dim}${"─".repeat(Math.min(width(), 40))}${c.reset}`);
            continue;
        }
        if (inCode) {
            out.push(`  ${c.green}${raw}${c.reset}`);
            continue;
        }
        // Images become a dim caption line rather than a bare URL.
        const img = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(raw.trim());
        if (img) {
            out.push(`  ${c.dim}[image${img[1] ? `: ${img[1]}` : ""}]${c.reset}`);
            continue;
        }
        const h = /^(#{1,6})\s+(.*)$/.exec(raw);
        if (h) {
            out.push("");
            out.push(`${c.bold}${c.blue}${h[2]}${c.reset}`);
            continue;
        }
        const line = raw
            .replace(/\*\*([^*]+)\*\*/g, `${c.bold}$1${c.reset}`)
            .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, `${c.italic}$1${c.reset}`)
            .replace(/`([^`]+)`/g, `${c.green}$1${c.reset}`)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `$1 ${c.dim}($2)${c.reset}`);
        out.push(wrap(line));
    }
    return out.join("\n");
}

function printHits(hits) {
    if (!hits.length) {
        console.log(`${c.dim}No results.${c.reset}`);
        return;
    }
    hits.forEach((h, i) => {
        console.log(
            `${c.bold}${String(i + 1).padStart(2)}. ${c.sand}${h.title}${c.reset}`,
        );
        console.log(
            `    ${c.dim}${h.section} · ${h.published.slice(0, 10)}${c.reset}`,
        );
        if (h.excerpt) console.log(wrap(`${c.dim}${h.excerpt}${c.reset}`, 4));
        console.log(`    ${c.blue}${h.url}${c.reset}\n`);
    });
}

function fail(err) {
    if (err instanceof SiteError) {
        console.error(`${c.red}${err.message}${c.reset}`);
        if (err.resolution) console.error(`${c.dim}${err.resolution}${c.reset}`);
    } else {
        console.error(`${c.red}${err.message}${c.reset}`);
    }
    process.exit(1);
}

function help() {
    console.log(`
${c.bold}${c.sand}iammatthias${c.reset} ${c.dim}— a terminal reader for ${ORIGIN}${c.reset}

  ${c.bold}iammatthias${c.reset}                    browse interactively
  ${c.bold}iammatthias search${c.reset} <terms>     ranked search
  ${c.bold}iammatthias read${c.reset} <path|slug>   render one document
  ${c.bold}iammatthias list${c.reset} [section]     list documents
  ${c.bold}iammatthias sections${c.reset}           list publications
  ${c.bold}iammatthias random${c.reset}             read something at random

${c.dim}Everything is public — no account, no API key.
The same content is available to agents over MCP at ${ORIGIN}/mcp${c.reset}
`);
}

/** Interactive browser: pick a section, pick a document, read it. */
async function browse() {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const ask = (q) => new Promise((res) => rl.question(q, res));

    try {
        for (;;) {
            const sections = await listSections();
            console.log(`\n${c.bold}${c.sand}iammatthias${c.reset}\n`);
            sections.forEach((s, i) => {
                console.log(
                    `  ${c.bold}${i + 1}${c.reset}. ${s.name} ${c.dim}(${s.entryCount})${c.reset}`,
                );
            });
            console.log(`  ${c.bold}s${c.reset}. search`);
            console.log(`  ${c.bold}q${c.reset}. quit\n`);

            const pick = (await ask("› ")).trim().toLowerCase();
            if (pick === "q" || pick === "") break;

            if (pick === "s") {
                const terms = (await ask("search: ")).trim();
                if (!terms) continue;
                const hits = await search(terms, { limit: 15 });
                printHits(hits);
                const which = (await ask("read # (enter to go back) › ")).trim();
                const hit = hits[Number(which) - 1];
                if (hit) console.log(renderMarkdown(await getDocument(hit.markdownUrl)));
                continue;
            }

            const section = sections[Number(pick) - 1];
            if (!section) continue;

            const items = await listContent({ section: section.slug, limit: 40 });
            console.log("");
            items.forEach((d, i) => {
                console.log(
                    `  ${c.bold}${String(i + 1).padStart(2)}${c.reset}. ${d.title} ${c.dim}${d.published.slice(0, 10)}${c.reset}`,
                );
            });
            const which = (await ask("\nread # (enter to go back) › ")).trim();
            const doc = items[Number(which) - 1];
            if (doc) console.log(renderMarkdown(await getDocument(doc.markdownUrl)));
        }
    } finally {
        rl.close();
    }
}

const [cmd, ...rest] = process.argv.slice(2);

try {
    switch (cmd) {
        case undefined:
            if (stdin.isTTY) await browse();
            else help();
            break;
        case "search":
            if (!rest.length) fail(new Error("Usage: iammatthias search <terms>"));
            printHits(await search(rest.join(" "), { limit: 15 }));
            break;
        case "read":
            if (!rest.length) fail(new Error("Usage: iammatthias read <path|slug>"));
            console.log(renderMarkdown(await getDocument(rest[0])));
            break;
        case "list": {
            const items = await listContent({ section: rest[0], limit: 100 });
            for (const d of items) {
                console.log(
                    `${c.dim}${d.published.slice(0, 10)}${c.reset}  ${c.sand}${d.section.padEnd(12)}${c.reset} ${d.title}`,
                );
            }
            break;
        }
        case "sections":
            for (const s of await listSections()) {
                console.log(
                    `${c.bold}${s.slug.padEnd(13)}${c.reset}${c.dim}${String(s.entryCount).padStart(3)}${c.reset}  ${s.description ?? s.name}`,
                );
            }
            break;
        case "random": {
            const items = await listContent({ limit: 500 });
            const pick = items[Math.floor(Math.random() * items.length)];
            console.log(renderMarkdown(await getDocument(pick.markdownUrl)));
            break;
        }
        case "-h":
        case "--help":
        case "help":
            help();
            break;
        default:
            console.error(`${c.red}Unknown command: ${cmd}${c.reset}`);
            help();
            process.exit(1);
    }
} catch (err) {
    fail(err);
}
