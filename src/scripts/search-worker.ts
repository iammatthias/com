/// <reference lib="webworker" />
// Search worker — owns the ternlight model, the corpus, and the vector
// index, entirely off the main thread. Compiling the ~10 MB WASM module
// and embedding text are synchronous; doing them here means the page
// never stutters while search warms up in the background.
//
// Corpus vectors come prebuilt from /api/search-vectors.json (embedded
// at build time — see that endpoint), so warming usually costs only
// the engine download/compile plus two small fetches. Only content
// published after the last build gets embedded here, and those vectors
// are cached in IndexedDB keyed by Farfield cid.
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

import { SEARCH_DIMS, SEARCH_MODEL } from "@lib/search-model";

const engine = import("@ternlight/base");

interface CorpusItem {
    href: string;
    title: string;
    kind: string;
    cid: string;
    text: string;
}

interface PrebuiltVectors {
    model: string;
    dims: number;
    /** cid → base64-encoded Float32Array. */
    vectors: Record<string, string>;
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

function b64ToVector(b64: string): Float32Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
}

/* ── minimal IndexedDB k/v (cid → Float32Array buffer) ─────────────── */

const DB_NAME = "menu-search";
const STORE = "vectors";
// Sentinel record: which model produced the cached vectors. A cid is
// stable across model swaps, so without this a model upgrade would
// silently mix incompatible vectors.
const MODEL_KEY = "__model__";

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetAll(
    db: IDBDatabase,
): Promise<Map<string, ArrayBuffer | string>> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly").objectStore(STORE);
        const keys = tx.getAllKeys();
        const vals = tx.getAll();
        vals.onsuccess = () => {
            const out = new Map<string, ArrayBuffer | string>();
            const ks = keys.result as string[];
            (vals.result as (ArrayBuffer | string)[]).forEach((v, i) =>
                out.set(ks[i], v),
            );
            resolve(out);
        };
        vals.onerror = () => reject(vals.error);
    });
}

async function dbReplace(
    db: IDBDatabase,
    entries: [string, ArrayBuffer | string][],
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
    // Engine chunk (wasm compile), live corpus, and prebuilt vectors in
    // parallel. The prebuilt file is optional — any failure just means
    // more client-side embedding below.
    const [{ embed }, corpus, prebuilt] = await Promise.all([
        engine,
        fetch("/api/search-corpus.json").then(
            (r) => r.json() as Promise<{ items: CorpusItem[] }>,
        ),
        fetch("/api/search-vectors.json")
            .then((r) => (r.ok ? (r.json() as Promise<PrebuiltVectors>) : null))
            .catch(() => null),
    ]);
    const items = corpus.items;
    const baked =
        prebuilt?.model === SEARCH_MODEL && prebuilt.dims === SEARCH_DIMS
            ? prebuilt.vectors
            : {};

    // IndexedDB covers what the build didn't: content published since.
    let cached = new Map<string, ArrayBuffer | string>();
    let staleModel = false;
    let db: IDBDatabase | null = null;
    try {
        db = await openDb();
        cached = await dbGetAll(db);
        staleModel =
            cached.size > 0 && cached.get(MODEL_KEY) !== SEARCH_MODEL;
    } catch {
        /* private browsing / quota — embed the gaps, skip persistence */
    }

    const vectors: Float32Array[] = [];
    const fresh: [string, ArrayBuffer | string][] = [];
    for (const item of items) {
        const bakedVec = baked[item.cid];
        if (bakedVec) {
            vectors.push(b64ToVector(bakedVec));
            continue;
        }
        const hit = staleModel ? undefined : cached.get(item.cid);
        if (hit && typeof hit !== "string") {
            vectors.push(new Float32Array(hit));
        } else {
            const v = embed(item.text);
            vectors.push(v);
            fresh.push([item.cid, v.buffer.slice(0) as ArrayBuffer]);
        }
    }
    if (db && (fresh.length > 0 || staleModel)) {
        // Drop what's no longer useful: everything on a model change,
        // otherwise vectors for deleted content and for cids the
        // prebuilt file now covers (no point storing those twice).
        const stale = [...cached.keys()].filter(
            (k) =>
                k !== MODEL_KEY &&
                (staleModel || !items.some((i) => i.cid === k) || k in baked),
        );
        fresh.push([MODEL_KEY, SEARCH_MODEL]);
        dbReplace(db, fresh, stale).catch(() => {});
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
