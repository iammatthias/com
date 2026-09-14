import { getCollection } from "astro:content";
import {
    resolveBodyMedia,
    type DocumentData,
    type FeedEntryData,
    type PublicationData,
    type ResolvedMedia,
} from "./farfield-loader";
import { publishedDocs } from "./content-query";

interface DeckItem {
    href: string;
    title: string;
    date: string;
}

export interface DeckFeedEntry {
    item: FeedEntryData;
    media: ResolvedMedia[];
}

export interface DeckColumnModel {
    id: string;
    label: string;
    href: string;
    total: number;
    peek: DeckItem[];
    feed?: DeckFeedEntry[];
}

const DECK_PEEK = 22;
const FEED_PEEK = 12;


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
    if (feed) columns.unshift(feed);

    return columns;
}

async function feedColumn(): Promise<DeckColumnModel | null> {
    const posts = (await getCollection("posts")).map((e) => e.data as FeedEntryData);
    if (posts.length === 0) return null;
    posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const feed = await Promise.all(
        posts.slice(0, FEED_PEEK).map(async (item) => ({
            item,
            media: await resolveBodyMedia(item.body),
        })),
    );
    return { id: "feed", label: "feed", href: "/feed", total: posts.length, peek: [], feed };
}
