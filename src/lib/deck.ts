import { getCollection } from "astro:content";
import type { DocumentData, PublicationData } from "./farfield-loader";
import { publishedDocs } from "./content-query";
import { noteTitle } from "./markdown-text";

interface DeckItem {
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

const DECK_PEEK = 22;


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
            title: noteTitle(p.body),
            date: p.createdAt,
        })),
    };
}
