// Client-side semantic search over the site's content, powered by
// ternlight (ternary-quantized embeddings compiled to WASM, running
// entirely in the browser — no search server, no API keys).
//
// Loaded lazily: SiteMenu dynamic-imports this module on first focus
// of the search field, and this module in turn pulls the ternlight
// chunk (~7 MB gz, one-time; served hashed + immutable-cached). The
// corpus comes from /api/search-corpus.json and gets embedded locally;
// vectors are cached in IndexedDB keyed by each item's Farfield cid,
// so only changed content is ever re-embedded on later visits.

interface CorpusItem {
    href: string;
    title: string;
    kind: string;
    cid: string;
    text: string;
}

export interface SearchResult {
    href: string;
    title: string;
    kind: string;
    score: number;
}

const DB_NAME = "menu-search";
const STORE = "vectors";

/* ── minimal IndexedDB k/v (cid → Float32Array buffer) ─────────────── */

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetAll(db: IDBDatabase): Promise<Map<string, ArrayBuffer>> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly").objectStore(STORE);
        const keys = tx.getAllKeys();
        const vals = tx.getAll();
        vals.onsuccess = () => {
            const out = new Map<string, ArrayBuffer>();
            const ks = keys.result as string[];
            (vals.result as ArrayBuffer[]).forEach((v, i) => out.set(ks[i], v));
            resolve(out);
        };
        vals.onerror = () => reject(vals.error);
    });
}

async function dbPutMany(
    db: IDBDatabase,
    entries: [string, ArrayBuffer][],
    staleKeys: string[],
): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        for (const key of staleKeys) store.delete(key);
        for (const [key, value] of entries) store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/* ── index ──────────────────────────────────────────────────────────── */

let indexPromise: Promise<{
    items: CorpusItem[];
    vectors: Float32Array[];
    embed: (text: string) => Float32Array;
}> | null = null;

async function buildIndex() {
    // Model chunk + corpus fetch in parallel; the model dominates.
    const [{ embed }, corpusRes] = await Promise.all([
        import("@ternlight/base"),
        fetch("/api/search-corpus.json"),
    ]);
    const { items } = (await corpusRes.json()) as { items: CorpusItem[] };

    // Vector cache: reuse anything whose cid is unchanged, embed the
    // rest, prune entries whose content no longer exists.
    let cached = new Map<string, ArrayBuffer>();
    let db: IDBDatabase | null = null;
    try {
        db = await openDb();
        cached = await dbGetAll(db);
    } catch {
        /* private browsing / quota — embed everything, skip persistence */
    }

    const vectors: Float32Array[] = [];
    const fresh: [string, ArrayBuffer][] = [];
    for (const item of items) {
        const hit = cached.get(item.cid);
        if (hit) {
            vectors.push(new Float32Array(hit));
        } else {
            const v = embed(item.text);
            vectors.push(v);
            fresh.push([item.cid, v.buffer.slice(0) as ArrayBuffer]);
        }
    }
    if (db && fresh.length > 0) {
        const live = new Set(items.map((i) => i.cid));
        const stale = [...cached.keys()].filter((k) => !live.has(k));
        dbPutMany(db, fresh, stale).catch(() => {});
    }

    return { items, vectors, embed };
}

/** Warm the model + index. Safe to call repeatedly. */
export function ensureIndex(): Promise<unknown> {
    indexPromise ??= buildIndex();
    return indexPromise;
}

/** Semantic top-K over the corpus. Resolves after ensureIndex(). */
export async function search(query: string, topK = 8): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const { items, vectors, embed } = await (indexPromise ?? buildIndex());
    const qv = embed(q);
    const scored = items.map((item, i) => {
        const v = vectors[i];
        let dot = 0;
        for (let d = 0; d < qv.length; d++) dot += qv[d] * v[d];
        return { href: item.href, title: item.title, kind: item.kind, score: dot };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}
