/// <reference lib="webworker" />

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

const DB_NAME = "menu-search";
const STORE = "vectors";
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

let indexPromise: Promise<{
    items: CorpusItem[];
    vectors: Float32Array[];
}> | null = null;

async function buildIndex() {
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

    let cached = new Map<string, ArrayBuffer | string>();
    let staleModel = false;
    let db: IDBDatabase | null = null;
    try {
        db = await openDb();
        cached = await dbGetAll(db);
        staleModel =
            cached.size > 0 && cached.get(MODEL_KEY) !== SEARCH_MODEL;
    } catch {
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
            const q = msg.query.trim().toLowerCase();
            const scored: WorkerHit[] = items.map((item, i) => {
                const v = vectors[i];
                let dot = 0;
                for (let d = 0; d < qv.length; d++) dot += qv[d] * v[d];
                const t = item.title.toLowerCase();
                if (q.length >= 3) {
                    if (t === q) dot += 0.3;
                    else if (t.includes(q)) dot += 0.15;
                }
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
