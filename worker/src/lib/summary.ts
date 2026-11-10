import { plainText } from "./markdown-text";
import { Lru } from "./lru";

interface SnippetRule {
    length: number;
    trim: boolean;
    strip?: RegExp;
    fallback?: string;
}

export const SUMMARIES = {
    noteTitle: { length: 44, trim: true },
    searchTitle: { length: 80, trim: false },
    feedIndexLink: { length: 100, trim: true, strip: /[[\]]/g, fallback: "(media)" },
    nowUpdate: { length: 140, trim: true },
    rssDescription: { length: 180, trim: false },
    postDescription: { length: 180, trim: true, fallback: "Feed entry." },
    docDescription: { length: 180, trim: true },
    excerpt: { length: 200, trim: true },
    searchText: { length: 600, trim: false },
} as const satisfies Record<string, SnippetRule>;

export type SnippetKind = Exclude<keyof typeof SUMMARIES, "noteTitle">;

interface BodyRecord {
    cid: string;
    body: string;
}

/** Bounded: every edit is a new cid, so an unbounded map only grows. */
const plainTextByCid = new Lru<string, string>(500);

export function bodyText(record: BodyRecord): string {
    let text = plainTextByCid.get(record.cid);
    if (text === undefined) {
        text = plainText(record.body);
        plainTextByCid.set(record.cid, text);
    }
    return text;
}

export function snippet(text: string, kind: SnippetKind): string {
    const rule: SnippetRule = SUMMARIES[kind];
    let out = text.slice(0, rule.length);
    if (rule.strip) out = out.replace(rule.strip, "");
    if (rule.trim) out = out.trim();
    return out || (rule.fallback ?? "");
}

export function summarize(record: BodyRecord, kind: SnippetKind): string {
    return snippet(bodyText(record), kind);
}

export function excerptOf(doc: BodyRecord & { description: string }): string {
    return doc.description || summarize(doc, "excerpt");
}

export function docDescription(doc: BodyRecord & { description: string }): string {
    return doc.description || summarize(doc, "docDescription");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A feed note named by its first words, or, a picture alone, by when it was posted. */
export function noteTitle(record: BodyRecord & { createdAt: string }): string {
    const words = bodyText(record);
    if (!words) {
        const d = new Date(record.createdAt);
        const date = Number.isNaN(d.getTime())
            ? record.createdAt.slice(0, 10)
            : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        return `Photograph, ${date}`;
    }
    // a phrase, not a paragraph: the first sentence, or its first words
    const first = words.split(/(?<=[.!?])\s/)[0];
    const { length } = SUMMARIES.noteTitle;
    if (first.length <= length) return first.replace(/[.!?]$/, "");
    const cut = words.slice(0, length);
    const sp = cut.lastIndexOf(" ");
    return `${sp > 20 ? cut.slice(0, sp) : cut}…`;
}
