// Smoke test — exercises every surface of the built site against a
// preview server and fails loudly on regressions. Catches the class of
// breakage that unit-less framework/adapter upgrades introduce: dead
// routes, broken redirects, missing SEO artifacts, unserved assets.
//
// Usage:
//   bun run build && bun run smoke     # spawns `astro preview` itself
//   BASE_URL=http://localhost:4321 bun run smoke   # against a running server
//
// Requires the Farfield read keys in .env (same as preview) — live
// routes render empty without them, and the content probes will fail.

import { spawn } from "node:child_process";

const OWNS_SERVER = !process.env.BASE_URL;
let BASE = process.env.BASE_URL ?? "http://localhost:4321";

let server = null;
if (OWNS_SERVER) {
    // An explicit port, because the default 4321 may be held by another
    // project's dev server — and the preview daemon silently binds a
    // different port while still reporting the one it was asked for,
    // which had this suite probing a stranger's site.
    const port = 4399;
    BASE = `http://localhost:${port}`;
    server = spawn("bunx", ["astro", "preview", "--port", String(port)], {
        stdio: "ignore",
        detached: false,
    });
}

async function waitForServer(timeoutMs = 60_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(BASE + "/", { redirect: "manual" });
            if (res.status > 0) return;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`preview server not reachable at ${BASE}`);
}

/** @type {{name: string, pass: boolean, detail: string}[]} */
const results = [];

function record(name, pass, detail = "") {
    results.push({ name, pass, detail });
    console.log(`${pass ? "  ok " : "FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(path, { redirect = "follow" } = {}) {
    const res = await fetch(BASE + path, { redirect });
    const body = redirect === "manual" ? "" : await res.text();
    return { res, body };
}

/**
 * @param {string} path
 * @param {object} opts
 * @param {number} [opts.status] expected status (default 200)
 * @param {(body: string, res: Response) => string | null} [opts.probe]
 *   returns null when satisfied, otherwise a failure description
 */
async function check(path, { status = 200, probe } = {}) {
    try {
        const { res, body } = await get(path);
        if (res.status !== status) {
            record(path, false, `status ${res.status}, expected ${status}`);
            return null;
        }
        const failure = probe ? probe(body, res) : null;
        record(path, failure === null, failure ?? "");
        return body;
    } catch (err) {
        record(path, false, String(err));
        return null;
    }
}

async function checkRedirect(path, target, statuses = [301]) {
    try {
        const { res } = await get(path, { redirect: "manual" });
        const location = res.headers.get("location") ?? "";
        const ok =
            statuses.includes(res.status) &&
            (location === target || location === BASE + target);
        record(
            `${path} → ${target}`,
            ok,
            ok ? "" : `got ${res.status} → ${location || "(none)"}`,
        );
    } catch (err) {
        record(`${path} → ${target}`, false, String(err));
    }
}

try {
    await waitForServer();

    // ---- core pages -------------------------------------------------
    const home = await check("/", {
        probe: (b) =>
            b.includes('rel="canonical"') && b.includes("application/ld+json")
                ? null
                : "missing canonical or JSON-LD",
    });
    await check("/now", {
        probe: (b) =>
            b.includes('"@type":"ProfilePage"') && b.includes('"sameAs"')
                ? null
                : "missing ProfilePage / Person sameAs JSON-LD",
    });
    await check("/resume");
    await check("/tags");
    await check("/onchain-analytics");
    await check("/nonexistent-page-xyz", { status: 404 });

    // ---- list surfaces + a live doc page ------------------------------
    const content = await check("/content", {
        probe: (b) => (b.includes("feed-grid") ? null : "no feed grid"),
    });
    const docPath = content?.match(
        /href="(\/(?!content|tags|feed|menu|resume|now|onchain)[a-z-]+\/[a-z0-9-]+)"/,
    )?.[1];
    if (docPath) {
        await check(docPath, {
            probe: (b) =>
                b.includes("colophon") &&
                b.includes("BlogPosting") &&
                b.includes("article:published_time")
                    ? null
                    : "missing colophon / BlogPosting / article meta",
        });
    } else {
        record("doc page discovery", false, "no doc link found on /content");
    }

    const feedPage = await check("/feed");
    const rkeyPath = feedPage?.match(/href="(\/feed\/[a-z0-9]{6,})"/)?.[1];
    if (rkeyPath) await check(rkeyPath);
    else record("feed entry discovery", false, "no entry link on /feed");

    // ---- SEO artifacts ------------------------------------------------
    await check("/sitemap.xml", {
        probe: (b) => {
            if (!b.includes("<urlset")) return "not a urlset";
            if (docPath && !b.includes(`${docPath}</loc>`))
                return `doc ${docPath} missing from sitemap`;
            if (!b.includes("<lastmod>")) return "no lastmod entries";
            return null;
        },
    });
    await check("/robots.txt", {
        probe: (b) => (b.includes("/sitemap.xml") ? null : "sitemap not referenced"),
    });
    await check("/api/search-corpus.json", {
        probe: (b) => {
            try {
                const { items } = JSON.parse(b);
                if (!Array.isArray(items) || items.length === 0)
                    return "empty corpus";
                if (!items[0].cid || !items[0].href || !items[0].text)
                    return "corpus item missing fields";
                return null;
            } catch {
                return "not valid JSON";
            }
        },
    });
    await check("/api/search-vectors.json", {
        probe: (b) => {
            try {
                const { model, dims, vectors } = JSON.parse(b);
                if (!model || !dims) return "missing model/dims";
                const cids = Object.keys(vectors);
                if (cids.length === 0)
                    return "no prebuilt vectors — build ran without Farfield keys?";
                // base64 Float32Array: dims * 4 bytes → ceil(n/3)*4 chars
                if (vectors[cids[0]].length < dims * 4)
                    return "vector payload too short for dims";
                return null;
            } catch {
                return "not valid JSON";
            }
        },
    });
    // Feed readers probe with HEAD before subscribing; Astro 7 endpoints
    // need explicit HEAD exports or these 404.
    try {
        const headRes = await fetch(BASE + "/rss.xml", { method: "HEAD" });
        record(
            "HEAD /rss.xml",
            headRes.status === 200,
            headRes.status === 200 ? "" : `status ${headRes.status}`,
        );
    } catch (err) {
        record("HEAD /rss.xml", false, String(err));
    }
    await check("/rss.xml", {
        probe: (b) => {
            if (!b.includes("content:encoded")) return "no full content";
            // Embeds must resolve to absolute image URLs (entity-escaped
            // inside content:encoded), not get stripped or leak raw
            // blob:// URIs into <img> tags.
            if (!b.includes("&lt;img src=&quot;https://wsrv.nl"))
                return "no resolved images in content";
            if (b.includes('img src=&quot;blob://')) return "unresolved blob:// image";
            if (!b.includes("<media:content")) return "no media:content thumbnails";
            // Gallery-heavy items must truncate with a canonical link.
            if (!b.includes("View the full gallery"))
                return "no gallery truncation link";
            return null;
        },
    });
    await check("/feed/rss.xml", {
        probe: (b) =>
            b.includes("content:encoded") ? null : "no full content",
    });

    // ---- redirects (legacy + trailing slash) --------------------------
    // /about is a real page again (it used to 301 to /now).
    await check("/about", {
        probe: (b) => (b.includes("cozy corner") ? null : "about copy missing"),
    });
    await checkRedirect("/post/12345", "/content");
    await checkRedirect("/content/old/thing", "/content");
    await checkRedirect("/now/", "/now");
    await checkRedirect("/sitemap-index.xml", "/sitemap.xml");
    // Prerendered pages are served by the asset layer, which may use
    // 307/308 for its slash normalization.
    await checkRedirect("/resume/", "/resume", [301, 307, 308]);

    // ---- headers + assets ---------------------------------------------
    if (home) {
        const { res } = await get("/");
        record(
            "security headers on SSR response",
            res.headers.get("x-content-type-options") === "nosniff",
            res.headers.get("x-content-type-options") ?? "(missing)",
        );
    }
    const fontPath = home?.match(/href="(\/_astro\/fonts\/[a-z0-9]+\.woff2)"/)?.[1];
    if (fontPath) await check(fontPath, { probe: () => null });
    else record("font preload discovery", false, "no font link on /");
} finally {
    if (server) server.kill("SIGTERM");
}

const failed = results.filter((r) => !r.pass);
console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
);
if (failed.length > 0) process.exit(1);
