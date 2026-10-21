// Runs the browser's search worker (app/search/search-worker.js, the shipped file) under bun:
// ternlight's wasm is initialised from node_modules once, the worker's `./tern_engine.js` import
// is pointed at that same module (the one edit to a temp copy of the file), `self` and `fetch` are
// stand-ins, and the corpus and baked vectors are whatever the caller hands in. Used by
// scripts/search-eval.ts and test/search-worker.test.ts.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// SEARCH_WORKER=<path> runs another copy of the file, for a before-and-after look at one query
export const WORKER_FILE = process.env.SEARCH_WORKER ?? join(import.meta.dir, "..", "..", "app", "search", "search-worker.js");
const PKG_WEB = join(import.meta.dir, "..", "node_modules", "@ternlight", "base", "pkg-web");
const ENGINE_IMPORT = 'from "./tern_engine.js"';

export interface CorpusItem {
    href: string;
    title: string;
    kind: string;
    cid: string;
    text: string;
    [key: string]: unknown;
}

export interface Hit {
    href: string;
    title: string;
    kind: string;
    score: number;
}

type Tern = {
    initSync(arg: { module: ArrayBuffer }): unknown;
    embed(text: string): Float32Array;
    tokenize(text: string): Uint32Array | number[];
};

let tern: Tern | undefined;
let modules = 0;

/** The ternlight engine the worker will share, initialised once per process. */
export async function engine(): Promise<Tern> {
    if (tern) return tern;
    tern = (await import(join(PKG_WEB, "tern_engine.js"))) as Tern;
    tern.initSync({ module: readFileSync(join(PKG_WEB, "tern_engine_bg.wasm")).buffer as ArrayBuffer });
    return tern;
}

export function toBase64(v: Float32Array): string {
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64");
}

export function sha256(s: string): string {
    return createHash("sha256").update(s).digest("hex");
}

/**
 * Vectors for every corpus item under `model`, cached on disk by hash of (model, text) so a change
 * to what gets embedded can never pick up a stale vector. Returns the shape /api/search-vectors.json
 * serves, keyed by cid as the worker expects.
 */
export async function bakedVectors(
    items: CorpusItem[],
    model: string,
    dims: number,
    cacheDir: string,
): Promise<{ model: string; dims: number; vectors: Record<string, string>; embedded: number }> {
    const { embed } = await engine();
    mkdirSync(cacheDir, { recursive: true });
    const file = join(cacheDir, "vectors.json");
    const cache: Record<string, string> = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    const vectors: Record<string, string> = {};
    let embedded = 0;
    for (const item of items) {
        const key = sha256(`${model}\n${item.text}`);
        if (!cache[key]) {
            cache[key] = toBase64(embed(item.text));
            embedded++;
        }
        vectors[item.cid] = cache[key];
    }
    if (embedded) writeFileSync(file, JSON.stringify(cache));
    return { model, dims, vectors, embedded };
}

export interface WorkerHandle {
    search(query: string, topK: number): Promise<Hit[]>;
    errors: string[];
}

/**
 * Load a fresh instance of the worker file against this corpus and this vectors file (null for a
 * 404, as a Worker with no baked vectors answers). Each call gets its own module instance, so its
 * own index; the wasm engine is shared.
 */
export async function loadWorker(
    corpus: { items: CorpusItem[] },
    vectors: { model: string; dims: number; vectors: Record<string, string> } | null,
): Promise<WorkerHandle> {
    await engine();
    const corpusBody = JSON.stringify(corpus);
    const vectorsBody = vectors ? JSON.stringify(vectors) : null;
    const fetchHere = (async (input: string | URL | Request) => {
        const url = String(input instanceof Request ? input.url : input);
        if (url.endsWith("/api/search-corpus.json")) return new Response(corpusBody, { headers: { "Content-Type": "application/json" } });
        if (url.endsWith("/api/search-vectors.json")) {
            return vectorsBody
                ? new Response(vectorsBody, { headers: { "Content-Type": "application/json" } })
                : new Response("", { status: 404 });
        }
        throw new Error(`the search worker fetched ${url}, which the harness does not serve`);
    }) as typeof fetch;

    const errors: string[] = [];
    const waiting = new Map<number, (hits: Hit[]) => void>();
    let id = 0;
    const self = {
        onmessage: null as null | ((event: { data: unknown }) => Promise<void>),
        postMessage(text: string) {
            const reply = JSON.parse(text) as { type: string; id?: number; hits?: Hit[]; message?: string };
            if (reply.type === "results" && reply.id !== undefined) waiting.get(reply.id)?.(reply.hits ?? []);
            if (reply.type === "error") {
                errors.push(reply.message ?? "error");
                if (reply.id !== undefined) waiting.get(reply.id)?.([]);
            }
        },
    };
    // the worker reads `self` and `fetch` as globals when a message arrives, so each handle
    // installs its own around a dispatch and puts fetch back after; several handles can then
    // live in one process, and other tests keep their own fetch
    const dispatch = async (data: unknown) => {
        (globalThis as { self?: unknown }).self = self;
        const previous = globalThis.fetch;
        globalThis.fetch = fetchHere;
        try {
            await self.onmessage?.({ data });
        } finally {
            globalThis.fetch = previous;
        }
    };
    (globalThis as { self?: unknown }).self = self;
    // the shipped file, with its one import pointed at the engine initialised above; a new copy
    // per handle so bun loads it again instead of returning the cached module, each in a new
    // directory because bun remembers a directory's listing between imports
    const source = readFileSync(WORKER_FILE, "utf8");
    if (source.split(ENGINE_IMPORT).length !== 2) throw new Error(`${WORKER_FILE} should import the engine exactly once with ${ENGINE_IMPORT}`);
    const dir = join(tmpdir(), "com-search-harness", `${process.pid}.${++modules}`);
    mkdirSync(dir, { recursive: true });
    const copy = join(dir, "search-worker.js");
    writeFileSync(copy, source.replace(ENGINE_IMPORT, `from ${JSON.stringify(join(PKG_WEB, "tern_engine.js"))}`));
    await import(copy);
    if (!self.onmessage) throw new Error(`${WORKER_FILE} did not set self.onmessage`);
    return {
        errors,
        async search(query, topK) {
            const myId = ++id;
            const hits = new Promise<Hit[]>((resolve) => waiting.set(myId, resolve));
            await dispatch({ type: "search", id: myId, query, topK });
            return hits;
        },
    };
}
