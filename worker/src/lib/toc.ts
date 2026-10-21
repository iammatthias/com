import { slugify } from "./slugs";
import { plainText } from "./markdown-text";

export function readingTime(body: string | undefined): {
    words: number;
    minutes: number;
} {
    if (!body) return { words: 0, minutes: 0 };
    const words = plainText(body).split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return { words, minutes };
}

interface TocEntry {
    id: string;
    text: string;
    level: 2 | 3;
}

export function buildToc(html: string): {
    html: string;
    entries: TocEntry[];
} {
    const entries: TocEntry[] = [];
    const decodeEntities = (s: string) =>
        s
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#x?([0-9a-fA-F]+);/g, (_m, code: string) =>
                String.fromCodePoint(
                    code.startsWith("x") || code.startsWith("X")
                        ? parseInt(code.slice(1), 16)
                        : parseInt(code, 10),
                ),
            );
    const slug = (s: string) =>
        slugify(decodeEntities(s).replace(/<[^>]+>/g, "")).slice(0, 60) ||
        "section";
    const used = new Set<string>();
    const dedupe = (base: string) => {
        let id = base;
        let n = 2;
        while (used.has(id)) id = `${base}-${n++}`;
        used.add(id);
        return id;
    };
    const out = html.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
        (match, lvl, attrs: string, inner: string) => {
            if (/\bclass=["'][^"']*ff-recipe/.test(attrs)) return match;
            const idMatch = attrs.match(/\bid=["']([^"']+)["']/);
            const id = idMatch ? idMatch[1] : dedupe(slug(inner));
            const level = Number(lvl) as 2 | 3;
            const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
            entries.push({ id, text, level });
            if (idMatch) return match;
            return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
        },
    );
    return { html: out, entries };
}
