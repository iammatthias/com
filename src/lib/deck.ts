import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "./farfield-loader";
import { publishedDocs } from "./content-query";

export interface DeckItem {
    href: string;
    title: string;
    date: string;
}

export interface DeckColumnModel {
    id: string;
    label: string;
    href: string;
    total: number;
    peek: DeckItem[];
}

export const DECK_PEEK = 22;

export const SITE_LINKS: DeckItem[] = [
    { href: "/about", title: "About", date: "" },
    { href: "/now", title: "Now", date: "" },
    { href: "/resume", title: "Resume", date: "" },
    { href: "/contact", title: "Contact", date: "" },
    { href: "/content", title: "All content", date: "" },
    { href: "/tags", title: "Tags", date: "" },
    { href: "/developers", title: "Developers", date: "" },
    { href: "/rss.xml", title: "RSS", date: "" },
    { href: "/llms.txt", title: "llms.txt", date: "" },
    { href: "/mcp", title: "MCP server", date: "" },
];

function toDeckItem(d: DocumentData): DeckItem {
    return { href: d.href, title: d.title, date: d.publishedAt };
}

async function publications(): Promise<PublicationData[]> {
    return (await getCollection("pubs")).map((e) => e.data as PublicationData);
}

let columnsOnce: Promise<DeckColumnModel[]> | null = null;

export function deckColumns(): Promise<DeckColumnModel[]> {
    columnsOnce ??= buildColumns();
    return columnsOnce;
}

async function buildColumns(): Promise<DeckColumnModel[]> {
    const [pubs, docs] = await Promise.all([publications(), publishedDocs()]);

    const byCollection = new Map<string, DocumentData[]>();
    for (const d of docs) {
        const list = byCollection.get(d.collection);
        if (list) list.push(d);
        else byCollection.set(d.collection, [d]);
    }

    const columns: DeckColumnModel[] = [];
    for (const pub of pubs) {
        const items = byCollection.get(pub.slug);
        if (!items || items.length === 0) continue;
        columns.push({
            id: pub.slug,
            label: pub.name.toLowerCase(),
            href: `/${pub.slug}`,
            total: items.length,
            peek: items.slice(0, DECK_PEEK).map(toDeckItem),
        });
    }

    columns.sort((a, b) => b.total - a.total);

    const feed = await feedColumn();
    if (feed) columns.push(feed);

    return columns;
}

async function feedColumn(): Promise<DeckColumnModel | null> {
    const posts = (await getCollection("posts")).map(
        (e) => e.data as { rkey: string; body: string; createdAt: string },
    );
    if (posts.length === 0) return null;
    posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
        id: "feed",
        label: "feed",
        href: "/feed",
        total: posts.length,
        peek: posts.slice(0, DECK_PEEK).map((p) => ({
            href: `/feed/${p.rkey}`,
            title: firstLine(p.body),
            date: p.createdAt,
        })),
    };
}

const NOTE_TITLE_MAX = 90;

function firstLine(body: string): string {
    const text = body
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/[#*_`>]/g, "")
        .trim();
    const line = text.split("\n").find((l) => l.trim().length > 0) ?? "";
    const trimmed = line.trim();
    return trimmed.length > NOTE_TITLE_MAX
        ? `${trimmed.slice(0, NOTE_TITLE_MAX).trimEnd()}…`
        : trimmed || "Note";
}
