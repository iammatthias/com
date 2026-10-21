// Scores the Find panel's results against scripts/search-eval.queries.json.
//
//   bun scripts/search-eval.ts [origin] [--set tune|holdout|all] [--topk N] [--refresh] [--fidelity] [--dump] [--show "query" [--top N]]
//
// The list scored is the one the panel shows: index items whose lowercased title or tag contains
// the lowercased query (home::matches_query, in index order), then the worker's hits with those
// removed, eight in all. The worker is the shipped app/search/search-worker.js, run under bun by
// search-harness.ts. The corpus is composed here by this tree's buildSearchCorpus from the raw
// documents and feed entries (fetched once from the Worker's app API and cached under the OS temp
// dir; --refresh refetches), so a change to what gets embedded is what gets scored. --fidelity
// compares that composition with the corpus the origin serves. --show prints one query's list.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DocumentData, FeedEntryData } from "../src/lib/farfield-loader";
import { plainText } from "../src/lib/markdown-text";
import { buildSearchCorpus, SEARCH_DIMS, SEARCH_MODEL } from "../src/lib/search-corpus";
import { bakedVectors, engine, loadWorker, toBase64, type CorpusItem, type Hit } from "./search-harness";

interface Query {
    q: string;
    class: string;
    set: "tune" | "holdout";
    expect: Record<string, number>;
}

interface IndexItem {
    title: string;
    href: string;
    tags: string[];
}

interface Raw {
    origin: string;
    fetchedAt: string;
    index: { items: IndexItem[] };
    docs: DocumentData[];
    feed: FeedEntryData[];
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
};
const origin = (args.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:8796").replace(/\/$/, "");
const set = value("--set") ?? "tune";
// how many hits the panel asks the worker for (site.rs); --topk N tries another number
const TOP_K = Number(value("--topk") ?? 6);
const SHOWN = 8;
const cacheDir = join(tmpdir(), "com-search-eval");
mkdirSync(cacheDir, { recursive: true });

async function getJson<T>(path: string): Promise<T> {
    const res = await fetch(origin + path);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json() as Promise<T>;
}

const route = (path: string) => `/api/app/route?path=${encodeURIComponent(path)}`;

async function fetchRaw(): Promise<Raw> {
    const index = await getJson<{ items: Array<IndexItem & { section: string }> }>("/api/app/index");
    const docs: DocumentData[] = [];
    for (const item of index.items) {
        const { doc } = await getJson<{ doc: Record<string, any> }>(route(item.href));
        const body = doc.markdown ?? "";
        // a document with no description of its own is served with the body's first 180 characters
        // in its place (app-route's docPayload); the raw record has none
        const derived = plainText(body).slice(0, 180).trim();
        docs.push({
            collection: doc.section.slug,
            rkey: doc.rkey,
            cid: doc.cid,
            title: doc.title,
            description: doc.description === derived ? "" : (doc.description ?? ""),
            published: true,
            href: doc.href,
            publishedAt: doc.publishedAt,
            updatedAt: doc.updatedAt,
            publication: { slug: doc.section.slug, name: doc.section.name },
            tags: doc.tags ?? [],
            body,
        });
    }
    const feed: FeedEntryData[] = [];
    const first = await getJson<{ pages: number; posts: Record<string, any>[] }>(route("/feed"));
    const pages = [first.posts];
    for (let p = 2; p <= first.pages; p++) pages.push((await getJson<{ posts: Record<string, any>[] }>(route(`/feed/page/${p}`))).posts);
    for (const post of pages.flat()) {
        feed.push({ rkey: post.rkey, cid: post.cid, body: post.body ?? "", tags: post.tags ?? [], createdAt: post.createdAt, updatedAt: post.updatedAt, media: post.media });
    }
    return { origin, fetchedAt: new Date().toISOString(), index: { items: index.items.map(({ title, href, tags }) => ({ title, href, tags: tags ?? [] })) }, docs, feed };
}

async function raw(): Promise<Raw> {
    const file = join(cacheDir, "raw.json");
    if (!flag("--refresh") && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    const data = await fetchRaw();
    writeFileSync(file, JSON.stringify(data));
    console.log(`fetched ${data.docs.length} documents and ${data.feed.length} feed entries from ${origin} -> ${file}`);
    return data;
}

/** home::matches_query: the lowercased query inside the title or any tag, index order. */
function lexical(items: IndexItem[], query: string): IndexItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q)));
}

/** The panel's list: what the words match, then what the meaning finds, once each, eight in all. */
function panel(items: IndexItem[], query: string, hits: Hit[]): string[] {
    const shown = lexical(items, query).map((i) => i.href);
    for (const h of hits) if (!shown.includes(h.href)) shown.push(h.href);
    return shown.slice(0, SHOWN);
}

interface Score {
    top1: number;
    rr: number;
    ndcg: number;
    recall: number;
    junk: number;
}

function score(shown: string[], expect: Record<string, number>): Score {
    const grades = shown.map((h) => expect[h] ?? 0);
    const relevant = Object.keys(expect);
    if (relevant.length === 0) return { top1: 0, rr: 0, ndcg: 0, recall: 0, junk: shown.length };
    const firstHit = grades.findIndex((g) => g > 0);
    const dcg = (gs: number[]) => gs.reduce((s, g, i) => s + g / Math.log2(i + 2), 0);
    const ideal = dcg(Object.values(expect).sort((a, b) => b - a).slice(0, SHOWN));
    return {
        top1: grades[0] === 2 ? 1 : 0,
        rr: firstHit < 0 ? 0 : 1 / (firstHit + 1),
        ndcg: dcg(grades) / ideal,
        recall: relevant.filter((h) => shown.includes(h)).length / relevant.length,
        junk: grades.filter((g) => g === 0).length,
    };
}

function mean(xs: number[]): number {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

const fmt = (x: number) => x.toFixed(3);

const data = await raw();
const indexItems = data.index.items;
const corpusItems = buildSearchCorpus(data.docs, data.feed) as CorpusItem[];
const corpus = { items: corpusItems };

const { embed } = await engine();
const once = toBase64(embed("the same words twice"));
if (once !== toBase64(embed("the same words twice"))) throw new Error("embed is not deterministic");

if (flag("--fidelity")) {
    const served = await getJson<{ items: CorpusItem[] }>("/api/search-corpus.json");
    const byHref = new Map(served.items.map((i) => [i.href, i]));
    let differ = 0;
    for (const item of corpusItems) {
        const s = byHref.get(item.href);
        if (!s || s.text !== item.text || s.title !== item.title || s.kind !== item.kind || s.cid !== item.cid) {
            differ++;
            if (differ <= 3) console.log(`  differs: ${item.href}\n    here:   ${JSON.stringify(item.text.slice(0, 120))}\n    served: ${JSON.stringify(s?.text.slice(0, 120))}`);
        }
    }
    const missing = served.items.filter((s) => !corpusItems.some((i) => i.href === s.href)).length;
    console.log(`fidelity: ${corpusItems.length} composed here, ${served.items.length} served by ${origin}, ${differ} differ, ${missing} served but not composed here`);
}

const baked = await bakedVectors(corpusItems, SEARCH_MODEL, SEARCH_DIMS, cacheDir);
const worker = await loadWorker(corpus, baked);

const file = JSON.parse(readFileSync(join(import.meta.dir, "search-eval.queries.json"), "utf8")) as { queries: Query[] };
const queries = file.queries.filter((q) => set === "all" || q.set === set);

const show = value("--show");
if (show) {
    const hits = await worker.search(show, Number(value("--top") ?? TOP_K));
    const lex = lexical(indexItems, show).map((i) => i.href);
    console.log(`lexical (${lex.length}): ${lex.join(", ") || "none"}`);
    for (const h of hits) console.log(`  ${h.score.toFixed(3)}  ${h.kind.padEnd(11)} ${h.href}`);
    console.log(`shown: ${panel(indexItems, show, hits).join(", ") || "Nothing matches."}`);
    process.exit(worker.errors.length ? 1 : 0);
}

const dump = flag("--dump");
const byClass = new Map<string, Score[]>();
const t0 = performance.now();
for (const q of queries) {
    const hits = await worker.search(q.q, TOP_K);
    const shown = panel(indexItems, q.q, hits);
    const s = score(shown, q.expect);
    byClass.set(q.class, [...(byClass.get(q.class) ?? []), s]);
    if (dump) {
        const lex = lexical(indexItems, q.q).length;
        console.log(`\n${q.class} | ${q.q}  (lexical ${lex}, nDCG ${fmt(s.ndcg)})`);
        for (const h of hits) {
            const grade = q.expect[h.href] ?? 0;
            const mark = shown.includes(h.href) ? " " : "x";
            console.log(`  ${mark} ${grade} ${h.score.toFixed(3)} ${h.kind.padEnd(11)} ${h.href}`);
        }
        for (const href of Object.keys(q.expect)) if (!shown.includes(href)) console.log(`  missed ${q.expect[href]} ${href}`);
    }
}
const ms = performance.now() - t0;

console.log(`set=${set}  queries=${queries.length}  corpus=${corpusItems.length}  model=${SEARCH_MODEL}  new vectors=${baked.embedded}  worker errors=${worker.errors.length}  ${ms.toFixed(0)} ms`);
console.log("class            n   top1   MRR    nDCG@8 recall@8  junk");
const answered: Score[] = [];
for (const [cls, scores] of byClass) {
    const row = `${cls.padEnd(15)} ${String(scores.length).padStart(2)}`;
    if (cls === "nothing") {
        console.log(`${row}   -      -      -      -        ${fmt(mean(scores.map((s) => s.junk)))}`);
        continue;
    }
    answered.push(...scores);
    console.log(`${row}  ${fmt(mean(scores.map((s) => s.top1)))}  ${fmt(mean(scores.map((s) => s.rr)))}  ${fmt(mean(scores.map((s) => s.ndcg)))}  ${fmt(mean(scores.map((s) => s.recall)))}     ${fmt(mean(scores.map((s) => s.junk)))}`);
}
const nothing = byClass.get("nothing") ?? [];
console.log(
    `all answered    ${String(answered.length).padStart(2)}  ${fmt(mean(answered.map((s) => s.top1)))}  ${fmt(mean(answered.map((s) => s.rr)))}  ${fmt(mean(answered.map((s) => s.ndcg)))}  ${fmt(mean(answered.map((s) => s.recall)))}     ${fmt(mean(answered.map((s) => s.junk)))}   nothing-junk ${fmt(mean(nothing.map((s) => s.junk)))}`,
);
for (const e of worker.errors) console.error("worker error:", e);
process.exit(worker.errors.length ? 1 : 0);
