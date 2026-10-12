import { livePublications, type DocumentData } from "./farfield-loader";
import { memo } from "./memo";
import { publishedDocs } from "./content-query";

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
    latest: string;
    peek: DeckItem[];
}

const DECK_PEEK = 3;


function toDeckItem(d: DocumentData): DeckItem {
    return { href: d.href, title: d.title, date: d.publishedAt };
}

export function deckColumns(): Promise<DeckColumnModel[]> {
    return memo("deck-columns", buildColumns, { ttlMs: 1_000 });
}

async function buildColumns(): Promise<DeckColumnModel[]> {
    const [pubs, docs] = await Promise.all([livePublications(), publishedDocs()]);

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
        const latest = items.reduce(
            (newest, d) => (d.publishedAt > newest ? d.publishedAt : newest),
            "",
        );
        columns.push({
            id: pub.slug,
            label: pub.name.toLowerCase(),
            href: `/${pub.slug}`,
            total: items.length,
            latest,
            peek: items.slice(0, DECK_PEEK).map(toDeckItem),
        });
    }

    columns.sort((a, b) => b.latest.localeCompare(a.latest));
    return columns;
}

