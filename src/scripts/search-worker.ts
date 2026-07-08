/// <reference lib="webworker" />
// Search worker — owns the ternlight model, the corpus, and the vector
// index, entirely off the main thread. Compiling the ~10 MB WASM module
// and embedding the whole corpus are synchronous; doing them here means
// the page never stutters while search warms up in the background.
//
// Spawned lazily by src/scripts/menu-search.ts, which holds the other
// end of the message protocol below.
//
// The engine loads via dynamic import so this module has NO top-level
// await (the wasm-bindgen glue instantiates its .wasm with one). With
// TLA, a module worker starts draining its message queue at the first
// await point — before the self.onmessage assignment at the bottom of
// this file runs — and the parent's "warm" message is silently
// dropped, hanging both sides forever. Keeping this module synchronous
// guarantees the handler exists before any message is delivered.

const engine = import("@ternlight/base");

interface CorpusItem {
    href: string;
    title: string;
    kind: string;
    cid: string;
    text: string;
}

export interface WorkerHit {
    href: string;
    title: string;
    kind: string;
    score: number;
}

export type WorkerRequest =
    | { type: "warm" }
    | { type: "search"; id: number; query: string; topK: number };

export type WorkerResponse =
    | { type: "ready" }
    | { type: "error"; id?: number; message: string }
    | { type: "results"; id: number; hits: WorkerHit[] };

const post = (msg: WorkerResponse) => self.postMessage(msg);

/* ── minimal IndexedDB k/v (cid → Float32Array buffer) ─────────────── */

const DB_NAME = "menu-search";
const STORE = "vectors";

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
}> | null = null;

async function buildIndex() {
    // Engine chunk (wasm compile) + corpus fetch in parallel; the
    // engine dominates on a cold cache.
    const [{ embed }, corpusRes] = await Promise.all([
        engine,
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

    return { items, vectors };
}

function ensureIndex() {
    indexPromise ??= buildIndex();
    return indexPromise;
}

/* ── protocol ───────────────────────────────────────────────────────── */

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const msg = event.data;
    try {
        if (msg.type === "warm") {
            await ensureIndex();
            post({ type: "ready" });
        } else if (msg.type === "search") {
            const [{ embed }, { items, vectors }] = await Promise.all([
                engine,
                ensureIndex(),
            ]);
            const qv = embed(msg.query);
            const scored: WorkerHit[] = items.map((item, i) => {
                const v = vectors[i];
                let dot = 0;
                for (let d = 0; d < qv.length; d++) dot += qv[d] * v[d];
                return {
                    href: item.href,
                    title: item.title,
                    kind: item.kind,
                    score: dot,
                };
            });
            scored.sort((a, b) => b.score - a.score);
            post({
                type: "results",
                id: msg.id,
                hits: scored.slice(0, msg.topK),
            });
        }
    } catch (err) {
        post({
            type: "error",
            id: msg.type === "search" ? msg.id : undefined,
            message: String(err),
        });
    }
};
