#!/usr/bin/env node

import { readFileSync } from "node:fs";

const [target, ...rest] = process.argv.slice(2);
if (!target || (target !== "--any" && !/^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(target))) {
    console.error("usage: node scripts/publish-latency.mjs </section/slug | --any> [--origin https://iammatthias.com] [--timeout 600]");
    process.exit(2);
}
const flag = (name, fallback) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : fallback;
};
const ORIGIN = flag("--origin", "https://iammatthias.com").replace(/\/$/, "");
const TIMEOUT_S = Number(flag("--timeout", "600"));
const KEY = readFileSync(new URL("../.env", import.meta.url), "utf8").match(/^CONTENT_READ_KEY=(.*)$/m)?.[1]?.trim();
const HEADERS = { Authorization: `Bearer ${KEY}`, "User-Agent": "iammatthias.com-latency/1.0" };
let path = target === "--any" ? null : target;
const POLL_MS = path ? 500 : 2_000;
let listEtag = null;
let listStamp = null;

async function farfieldUpdated() {
    if (path) {
        const res = await fetch(`https://content.farfield.systems/api/entries/${path.split("/")[2]}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`farfield ${res.status}`);
        return (await res.json()).updatedAt;
    }
    const res = await fetch("https://content.farfield.systems/api/entries", {
        headers: listEtag ? { ...HEADERS, "If-None-Match": listEtag } : HEADERS,
    });
    if (res.status === 304) return listStamp;
    if (!res.ok) throw new Error(`farfield ${res.status}`);
    const newest = (await res.json()).entries.filter((e) => e.published).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    listEtag = res.headers.get("etag");
    listStamp = `${newest.collection}/${newest.slug}@${newest.updatedAt}`;
    return listStamp;
}

async function tolerant(fn) {
    for (;;) {
        try {
            return await fn();
        } catch (err) {
            console.error(`retrying after ${err.cause?.code ?? err.message}`);
            await sleep(5_000);
        }
    }
}

async function siteUpdated() {
    const res = await fetch(`${ORIGIN}${path}.md`, { headers: { "User-Agent": "iammatthias.com-latency/1.0" } });
    return (await res.text()).match(/^updated: (\S+)$/m)?.[1] ?? null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const baseline = await tolerant(farfieldUpdated);
console.log(`watching ${path ?? "every published entry"} — latest ${baseline}; save in Farfield now`);
const started = Date.now();
let saved = null;
while (!saved) {
    if ((Date.now() - started) / 1000 > TIMEOUT_S) throw new Error("no save seen");
    const now = await tolerant(farfieldUpdated);
    if (now !== baseline) saved = { stamp: now, seenAt: Date.now() };
    else await sleep(POLL_MS);
}
if (!path) {
    const [ref, stamp] = saved.stamp.split("@");
    path = `/${ref}`;
    saved.stamp = stamp;
}
console.log(`saved ${path} at ${saved.stamp}`);
const savedAt = Date.parse(saved.stamp);
while ((await tolerant(siteUpdated)) !== saved.stamp) {
    if ((Date.now() - saved.seenAt) / 1000 > TIMEOUT_S) throw new Error("site never caught up");
    await sleep(500);
}
const visible = Date.now();
console.log(`visible ${((visible - savedAt) / 1000).toFixed(1)}s after the save (${((visible - saved.seenAt) / 1000).toFixed(1)}s after this watcher saw it)`);
