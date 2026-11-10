import init, { embed } from "./tern_engine.js";

const SEARCH_MODEL = "@ternlight/base@0.1";
const SEARCH_DIMS = 384;

async function patiently(load, waits = [800, 3200]) {
    for (let i = 0; ; i++) {
        try {
            return await load();
        } catch (e) {
            if (i >= waits.length) throw e;
            await new Promise((wake) => setTimeout(wake, waits[i]));
        }
    }
}

function kept(load) {
    let p = null;
    return () =>
        (p ??= load().catch((e) => {
            p = null;
            throw e;
        }));
}

const ensureEngine = kept(() => patiently(() => init({ module_or_path: new URL("./tern_engine_bg.wasm", import.meta.url) })));

const UNDECOMPOSED = { ø: "o", æ: "ae", œ: "oe", ł: "l", đ: "d", ð: "d", þ: "th", ß: "ss", ı: "i" };
const UNDECOMPOSED_RE = new RegExp(`[${Object.keys(UNDECOMPOSED).join("")}]`, "g");
function fold(s) {
    return s.normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(UNDECOMPOSED_RE, (c) => UNDECOMPOSED[c]);
}

function terms(q, texts) {
    const words = fold(q)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 2);
    const each = words.map((t) => {
        const pattern = new RegExp(`(^|[^a-z0-9])${t}`);
        let df = 0;
        for (const text of texts) if (pattern.test(text)) df++;
        return { pattern, weight: Math.log(1 + (texts.length - df + 0.5) / (df + 0.5)) };
    });
    const total = each.reduce((s, w) => s + w.weight, 0);
    return {
        each,
        total,
        phrase: words.length ? new RegExp(`(^|[^a-z0-9])${words.join("[^a-z0-9]+")}($|[^a-z0-9])`) : null,
    };
}

function wordsBonus({ each, total, phrase }, text) {
    if (each.length === 0 || total === 0) return 0;
    if (phrase.test(text)) return 1;
    let hit = 0;
    for (const { pattern, weight } of each) if (pattern.test(text)) hit += weight;
    const c = hit / total;
    return c === 1 ? 0.67 : c * c;
}

function b64ToVector(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
}

const DB_NAME = "menu-search";
const STORE = "vectors";
const MODEL_KEY = "__model__";

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function dbGetAll(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly").objectStore(STORE);
        const keys = tx.getAllKeys();
        const vals = tx.getAll();
        vals.onsuccess = () => {
            const out = new Map();
            vals.result.forEach((v, i) => out.set(keys.result[i], v));
            resolve(out);
        };
        vals.onerror = () => reject(vals.error);
    });
}

function dbReplace(db, entries, staleKeys) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        for (const key of staleKeys) store.delete(key);
        for (const [key, value] of entries) store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function buildIndex() {
    const [, corpus, prebuilt] = await Promise.all([
        ensureEngine(),
        patiently(() =>
            fetch("/api/search-corpus.json").then((r) => {
                if (!r.ok) throw new Error(`search corpus: ${r.status}`);
                return r.json();
            }),
        ),
        fetch("/api/search-vectors.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    const items = corpus.items;
    const baked = prebuilt?.model === SEARCH_MODEL && prebuilt.dims === SEARCH_DIMS ? prebuilt.vectors : {};

    let cached = new Map();
    let staleModel = false;
    let db = null;
    try {
        db = await openDb();
        cached = await dbGetAll(db);
        staleModel = cached.size > 0 && cached.get(MODEL_KEY) !== SEARCH_MODEL;
    } catch {}

    const vectors = [];
    const fresh = [];
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
            fresh.push([item.cid, v.buffer.slice(0)]);
        }
    }
    if (db && (fresh.length > 0 || staleModel)) {
        const stale = [...cached.keys()].filter(
            (k) => k !== MODEL_KEY && (staleModel || !items.some((i) => i.cid === k) || k in baked),
        );
        fresh.push([MODEL_KEY, SEARCH_MODEL]);
        dbReplace(db, fresh, stale).catch(() => {});
    }
    const folded = items.map((item) => {
        const text = fold(item.text);
        const weight = Math.min(1, text.split(/[^a-z0-9]+/).filter(Boolean).length / 8);
        return { title: fold(item.title), text, weight };
    });
    return { items, vectors, folded };
}

const ensureIndex = kept(buildIndex);

self.onmessage = async (event) => {
    const msg = event.data;
    try {
        if (msg.type === "warm") {
            await ensureIndex();
            self.postMessage(JSON.stringify({ type: "ready" }));
        } else if (msg.type === "search") {
            const [, { items, vectors, folded }] = await Promise.all([ensureEngine(), ensureIndex()]);
            const qv = embed(msg.query);
            const q = fold(msg.query.trim());
            const words = terms(q, folded.map((f) => f.text));
            const scored = items.map((item, i) => {
                const v = vectors[i];
                let dot = 0;
                for (let d = 0; d < qv.length; d++) dot += qv[d] * v[d];
                dot *= folded[i].weight;
                const t = folded[i].title;
                if (q.length >= 3) {
                    if (t === q) dot += 0.3;
                    else if (t.includes(q)) dot += 0.15;
                }
                dot += 0.3 * wordsBonus(words, folded[i].text);
                return { href: item.href, title: item.title, kind: item.kind, score: dot };
            });
            scored.sort((a, b) => b.score - a.score);
            const hits = scored.filter((h) => h.score >= 0.22).slice(0, msg.topK);
            self.postMessage(JSON.stringify({ type: "results", id: msg.id, hits }));
        }
    } catch (err) {
        self.postMessage(JSON.stringify({ type: "error", id: msg.id, message: String(err) }));
    }
};
