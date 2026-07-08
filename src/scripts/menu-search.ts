// Main-thread client for the semantic menu search. All the heavy
// lifting — the ternlight WASM model (~7 MB gz, one-time download,
// immutable-cached), corpus embedding, and the IndexedDB vector
// cache — lives in src/scripts/search-worker.ts and runs off-thread,
// so warming the index never blocks the page.
//
// SiteMenu dynamic-imports this module (during page idle, or on first
// focus of the search field, whichever comes first) and talks through
// ensureIndex()/search(). The worker protocol is defined in the worker
// module; only its types are imported here, so nothing of the worker
// leaks into the main bundle.

import type {
    WorkerHit,
    WorkerRequest,
    WorkerResponse,
} from "@src/scripts/search-worker";

export type SearchResult = WorkerHit;

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;
let ready = false;

interface Pending {
    resolve: (hits: SearchResult[]) => void;
    reject: (err: Error) => void;
}
const pending = new Map<number, Pending>();
let nextId = 0;

function failAll(message: string) {
    for (const p of pending.values()) p.reject(new Error(message));
    pending.clear();
}

function getWorker(): Worker {
    if (worker) return worker;
    worker = new Worker(new URL("./search-worker.ts", import.meta.url), {
        type: "module",
    });
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if (msg.type === "results") {
            pending.get(msg.id)?.resolve(msg.hits);
            pending.delete(msg.id);
        } else if (msg.type === "error") {
            if (msg.id !== undefined) {
                pending.get(msg.id)?.reject(new Error(msg.message));
                pending.delete(msg.id);
            } else {
                failAll(msg.message);
            }
        }
    });
    // Uncaught worker failure (e.g. the wasm chunk failed to load) —
    // surface it to whoever is awaiting warm-up or a query.
    worker.addEventListener("error", (event) => {
        failAll(event.message || "search worker crashed");
    });
    return worker;
}

/** True once the model + index are warm — callers can skip loading UI. */
export function isReady(): boolean {
    return ready;
}

/** Warm the model + index off-thread. Safe to call repeatedly. */
export function ensureIndex(): Promise<void> {
    readyPromise ??= new Promise<void>((resolve, reject) => {
        const w = getWorker();
        const onMessage = (event: MessageEvent<WorkerResponse>) => {
            const msg = event.data;
            if (msg.type === "ready") {
                ready = true;
                w.removeEventListener("message", onMessage);
                resolve();
            } else if (msg.type === "error" && msg.id === undefined) {
                w.removeEventListener("message", onMessage);
                reject(new Error(msg.message));
            }
        };
        w.addEventListener("message", onMessage);
        w.addEventListener("error", (event) => {
            reject(new Error(event.message || "search worker crashed"));
        });
        w.postMessage({ type: "warm" } satisfies WorkerRequest);
    });
    return readyPromise;
}

/** Semantic top-K over the corpus. Resolves after ensureIndex(). */
export async function search(query: string, topK = 8): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    await ensureIndex();
    return new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        getWorker().postMessage({
            type: "search",
            id,
            query: q,
            topK,
        } satisfies WorkerRequest);
    });
}
