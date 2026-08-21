#!/usr/bin/env node
// Agent-readiness gate. Runs against a built ./dist (default) or a
// live origin (--url https://…), and fails the process on any broken
// invariant so a regression can't reach production.
//
//   bun run agent:check              # checks ./dist after a build
//   bun run agent:check --url https://iammatthias.com
//
// What it enforces, and why each one is here rather than trusted:
//   - every well-known/discovery document exists and parses
//   - llms.txt links actually resolve to markdown (a scan once
//     reported ours as dead ends; they weren't, but nothing was
//     checking)
//   - markdown twins lead with front matter or a heading, never HTML
//   - every HTML page has exactly one <h1> and parseable JSON-LD
//   - the OpenAPI spec's declared paths answer
//   - (live only) AI crawler user-agents aren't blocked at the edge

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const ORIGIN = urlFlag >= 0 ? args[urlFlag + 1].replace(/\/$/, "") : null;
const DIST = path.resolve("dist/client");

let failures = 0;
let passes = 0;
let skipped = 0;
const problems = [];

// Routes rendered on demand: absent from ./dist by design, so they can
// only be verified against a live origin. Keep this list tight — a
// path added here stops being checked in CI.
const SSR_ONLY = new Set([
    "/graphql",
    "/api/content.json",
    "/.well-known/mcp",
    "/",
    "/now",
    "/feed",
    "/feed.md",
    "/api/search.json",
    "/api/search-corpus.json",
    "/mcp",
]);

function ssrSkipped(p) {
    if (ORIGIN || !SSR_ONLY.has(p)) return false;
    skipped++;
    if (process.env.VERBOSE) console.log(`  skip ${p} (on-demand route)`);
    return true;
}

function ok(label) {
    passes++;
    if (process.env.VERBOSE) console.log(`  ok   ${label}`);
}
function fail(label, detail) {
    failures++;
    problems.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

/** Fetch a path from the live origin or read it from ./dist. */
async function get(p) {
    if (ORIGIN) {
        const res = await fetch(ORIGIN + p, {
            headers: { "user-agent": "iammatthias-agent-check/1.0" },
            redirect: "follow",
            signal: AbortSignal.timeout(20000),
        });
        return {
            status: res.status,
            type: res.headers.get("content-type") ?? "",
            body: await res.text(),
            headers: res.headers,
        };
    }
    // Static build: try the path, then .html, then /index.html.
    const candidates = [p, `${p}.html`, path.join(p, "index.html")];
    for (const c of candidates) {
        const file = path.join(DIST, c);
        try {
            if ((await stat(file)).isFile()) {
                return {
                    status: 200,
                    type: guessType(file),
                    body: await readFile(file, "utf8"),
                    headers: new Headers(),
                };
            }
        } catch {
            /* try next candidate */
        }
    }
    return { status: 404, type: "", body: "", headers: new Headers() };
}

function guessType(file) {
    if (file.endsWith(".md")) return "text/markdown";
    if (file.endsWith(".json")) return "application/json";
    if (file.endsWith(".xml")) return "application/xml";
    if (file.endsWith(".txt")) return "text/plain";
    return "text/html";
}

async function expect200(p, label) {
    if (ssrSkipped(p)) return null;
    const r = await get(p);
    if (r.status !== 200) return fail(label ?? p, `status ${r.status}`);
    ok(label ?? p);
    return r;
}

async function expectJSON(p, validate, label) {
    if (ssrSkipped(p)) return null;
    const r = await get(p);
    if (r.status !== 200) return fail(label ?? p, `status ${r.status}`);
    let data;
    try {
        data = JSON.parse(r.body);
    } catch (e) {
        return fail(label ?? p, `invalid JSON: ${e.message}`);
    }
    const problem = validate?.(data);
    if (problem) return fail(label ?? p, problem);
    ok(label ?? p);
    return data;
}

async function expectMarkdown(p, label) {
    if (ssrSkipped(p)) return null;
    const r = await get(p);
    if (r.status !== 200) return fail(label ?? p, `status ${r.status}`);
    if (ORIGIN && !r.type.includes("markdown")) {
        return fail(label ?? p, `content-type ${r.type || "none"}`);
    }
    const head = r.body.trimStart().slice(0, 200);
    if (/^<(?:!doctype|html)/i.test(head)) {
        return fail(label ?? p, "body is HTML, not markdown");
    }
    if (!head.startsWith("---") && !head.startsWith("#")) {
        return fail(label ?? p, "body does not lead with front matter or heading");
    }
    ok(label ?? p);
    return r;
}

console.log(
    `agent-check → ${ORIGIN ?? "dist/client"}\n`,
);

// ---- discovery documents ----------------------------------------------
await expect200("/robots.txt");
await expect200("/sitemap.xml");
await expectMarkdown("/llms.txt");
await expectMarkdown("/llms-full.txt");
await expectMarkdown("/index.md");
await expectMarkdown("/llms.md");
await expectMarkdown("/auth.md");
await expectMarkdown("/pricing.md");

await expectJSON(
    "/openapi.json",
    (d) =>
        !d.openapi
            ? "missing openapi version"
            : !d.paths || Object.keys(d.paths).length === 0
              ? "no paths declared"
              : Object.values(d.paths).some((ops) =>
                      Object.values(ops).some((op) => !op.operationId || !op.description),
                  )
                ? "an operation is missing operationId or description"
                : null,
    "/openapi.json",
);

await expectJSON("/.well-known/ai-catalog.json", (d) => {
    // Shape per the AI Catalog spec — a scan once accepted the file as
    // "present but invalid", which scores the same as absent.
    if (!d.specVersion) return "missing specVersion";
    if (!d.host?.identifier) return "missing host.identifier";
    if (!Array.isArray(d.entries) || !d.entries.length) return "entries is not a non-empty array";
    for (const e of d.entries) {
        if (!/^urn:air:iammatthias\.com:/.test(e.identifier ?? "")) return `entry ${e.displayName ?? "?"} needs a domain-anchored urn:air identifier`;
        if (!e.type) return `entry ${e.identifier} has no media type`;
        if (!e.url === !e.data) return `entry ${e.identifier} needs exactly one of url or data`;
    }
    return null;
});
await expectJSON("/.well-known/mcp", (d) =>
    d.serverUrl ? null : "missing serverUrl",
);
await expectJSON("/.well-known/openapi.json", (d) =>
    d.openapi ? null : "missing openapi version",
);
await expectMarkdown("/.well-known/pricing.md");
await expectMarkdown("/developers/llms.txt");
await expectJSON(
    "/.well-known/agent-card.json",
    (d) => (d.name && Array.isArray(d.skills) ? null : "missing name or skills"),
);
await expectJSON(
    "/.well-known/agent-skills/index.json",
    (d) =>
        Array.isArray(d.skills) && d.skills.every((s) => s.name && s.description)
            ? null
            : "a skill is missing name or description",
);
await expectJSON(
    "/.well-known/mcp/server-card.json",
    (d) =>
        d.name && d.serverUrl && Array.isArray(d.tools) && d.tools.length
            ? null
            : "missing name, serverUrl, or tools",
);
await expectJSON(
    "/.well-known/api-catalog",
    (d) => (Array.isArray(d.linkset) && d.linkset.length ? null : "empty linkset"),
);
await expectJSON(
    "/.well-known/oauth-protected-resource",
    (d) => (d.resource ? null : "missing resource"),
);

// ---- GraphQL -----------------------------------------------------------
await expect200("/schema.graphql");
{
    const sdl = await get("/schema.graphql");
    if (sdl.status === 200) {
        for (const needed of ["type Query", "DocumentConnection", "PageInfo", "QueryError"]) {
            if (!sdl.body.includes(needed)) fail("schema.graphql", `missing ${needed}`);
            else ok(`schema.graphql declares ${needed}`);
        }
    }
}
if (ORIGIN) {
    // Introspection must be public — an auth-gated schema is
    // undiscoverable, which defeats the point of publishing one.
    const res = await fetch(`${ORIGIN}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "{__schema{queryType{name}}}" }),
    });
    const body = await res.json().catch(() => null);
    if (body?.data?.__schema?.queryType?.name === "Query") ok("graphql introspection");
    else fail("graphql introspection", `status ${res.status}`);

    const q = await fetch(`${ORIGIN}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "{sections{slug entryCount}}" }),
    });
    const qb = await q.json().catch(() => null);
    if (Array.isArray(qb?.data?.sections) && qb.data.sections.length) ok("graphql sections query");
    else fail("graphql sections query", JSON.stringify(qb?.errors ?? qb).slice(0, 120));
}

// ---- trust anchors -----------------------------------------------------
for (const p of ["/about", "/contact", "/privacy"]) {
    if (ssrSkipped(p)) continue;
    const r = await get(p);
    if (r.status !== 200) {
        fail(p, `status ${r.status}`);
        continue;
    }
    const text = r.body
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (text.length < 500) fail(p, `only ${text.length} chars of text (need 500+)`);
    else ok(`${p} (${text.length} chars)`);
}

// ---- HTML structure ----------------------------------------------------
const HTML_PAGES = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/developers",
    "/now",
    "/content",
    "/tags",
];
for (const p of HTML_PAGES) {
    if (ssrSkipped(p)) continue;
    const r = await get(p);
    if (r.status !== 200) {
        fail(`${p} html`, `status ${r.status}`);
        continue;
    }
    const h1s = (r.body.match(/<h1[\s>]/g) ?? []).length;
    if (h1s !== 1) fail(`${p} h1`, `found ${h1s}, expected exactly 1`);
    else ok(`${p} h1`);

    const ld = r.body.match(
        /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!ld) fail(`${p} json-ld`, "missing");
    else {
        try {
            const g = JSON.parse(ld[1]);
            if (!g["@graph"]?.length) fail(`${p} json-ld`, "empty @graph");
            else ok(`${p} json-ld`);
        } catch (e) {
            fail(`${p} json-ld`, `invalid JSON: ${e.message}`);
        }
    }

    for (const [needle, label] of [
        ['rel="canonical"', "canonical"],
        ['property="og:image"', "og:image"],
        ['property="og:type"', "og:type"],
        ['<html lang=', "html lang"],
    ]) {
        if (!r.body.includes(needle)) fail(`${p} ${label}`, "missing");
        else ok(`${p} ${label}`);
    }
}

// ---- llms.txt links all resolve ---------------------------------------
{
    const r = await get("/llms.txt");
    const links = [...r.body.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
    const paths = [
        ...new Set(links.map((u) => u.replace(/^https:\/\/[^/]+/, ""))),
    ];
    let broken = 0;
    for (const p of paths) {
        if (ssrSkipped(p)) continue;
        const t = await get(p);
        if (t.status !== 200) {
            broken++;
            fail(`llms.txt → ${p}`, `status ${t.status}`);
        } else if (
            p.endsWith(".md") &&
            /^<(?:!doctype|html)/i.test(t.body.trimStart())
        ) {
            broken++;
            fail(`llms.txt → ${p}`, "returned HTML, not markdown");
        }
    }
    if (!broken) ok(`llms.txt: all ${paths.length} links resolve`);
}

// ---- every catalog URL resolves ---------------------------------------
if (ORIGIN) {
    // An entry pointing at something that 404s teaches agents the
    // whole catalog is unreliable — we shipped exactly that once with
    // an unpublished npm package.
    const cat = await get("/.well-known/ai-catalog.json");
    if (cat.status === 200) {
        try {
            const entries = JSON.parse(cat.body).entries ?? [];
            for (const e of entries) {
                if (!e.url) continue;
                const res = await fetch(e.url, {
                    method: "GET",
                    headers: { "user-agent": "iammatthias-agent-check/1.0" },
                    signal: AbortSignal.timeout(15000),
                }).catch(() => null);
                if (!res || res.status >= 400) {
                    fail(`ai-catalog ${e.identifier ?? e.url}`, `${e.url} -> ${res?.status ?? "unreachable"}`);
                } else ok(`ai-catalog entry ${e.identifier?.split(":").pop() ?? e.url}`);
            }
        } catch (err) {
            fail("ai-catalog entries", err.message);
        }
    }
}

// ---- per-section llms.txt + a sample markdown twin --------------------
const { SECTION_SLUGS } = await import("../src/lib/agent-surface.ts").catch(
    () => ({ SECTION_SLUGS: ["art", "posts", "recipes", "melange", "open-source"] }),
);
for (const s of SECTION_SLUGS) {
    await expectMarkdown(`/${s}/llms.txt`, `/${s}/llms.txt`);
    await expectMarkdown(`/${s}.md`, `/${s}.md`);
}

// ---- OpenAPI declared paths answer ------------------------------------
{
    const spec = await get("/openapi.json");
    if (spec.status === 200) {
        try {
            const d = JSON.parse(spec.body);
            for (const [p, ops] of Object.entries(d.paths ?? {})) {
                if (ssrSkipped(p)) continue;
                // Supply required params — an endpoint that demands one
                // is *supposed* to 400 without it, so a bare probe
                // would report correct behaviour as a failure.
                const required = (ops.get?.parameters ?? []).filter((x) => x.required);
                const qs = new URLSearchParams();
                for (const param of required) {
                    qs.set(param.name, param.schema?.type === "integer" ? "1" : "test");
                }
                const probe = qs.toString() ? `${p}?${qs}` : p;
                const r = await get(probe);
                if (r.status !== 200) fail(`openapi path ${probe}`, `status ${r.status}`);
                else ok(`openapi path ${probe}`);
            }
        } catch {
            /* already reported above */
        }
    }
}

// ---- negotiation, agent 404s, versioning (live only) -----------------
if (ORIGIN) {
    // acceptmarkdown.com: the homepage must answer Accept: text/markdown
    // with markdown, and say so in Vary.
    const md = await fetch(ORIGIN + "/", {
        headers: { accept: "text/markdown" },
        signal: AbortSignal.timeout(20000),
    });
    const ct = md.headers.get("content-type") ?? "";
    if (!ct.includes("markdown")) fail("homepage Accept negotiation", `got ${ct}`);
    else ok("homepage Accept negotiation");
    const vary = (md.headers.get("vary") ?? "").toLowerCase();
    if (!vary.includes("accept")) fail("homepage Vary", `got "${vary}"`);
    else ok("homepage Vary: Accept");

    // A 404 an agent can recover from: real status, markdown body.
    const nf = await fetch(`${ORIGIN}/definitely-not-a-real-path-${Date.now()}`, {
        headers: { accept: "text/markdown" },
        signal: AbortSignal.timeout(20000),
    });
    const nfBody = await nf.text();
    if (nf.status !== 404) fail("agent 404 status", `got ${nf.status}`);
    else if (!(nf.headers.get("content-type") ?? "").includes("markdown")) {
        fail("agent 404 content-type", nf.headers.get("content-type") ?? "none");
    } else if (!/llms\.txt/.test(nfBody) || !/sitemap/.test(nfBody)) {
        fail("agent 404 body", "no recovery links (llms.txt / sitemap)");
    } else ok("agent 404 is markdown with recovery links");

    // Bot user agents get markdown even when they ask for HTML.
    const bot = await fetch(`${ORIGIN}/?bot=${Date.now()}`, {
        headers: { "user-agent": "ClaudeBot/1.0", accept: "text/html" },
        signal: AbortSignal.timeout(20000),
    });
    if ((bot.headers.get("content-type") ?? "").includes("markdown")) {
        ok("bot-UA gets markdown");
    } else fail("bot-UA markdown", bot.headers.get("content-type") ?? "none");

    // MCP must handshake even without a Content-Type header — Astro's
    // CSRF check used to 403 exactly that case.
    const bare = await fetch(`${ORIGIN}/.well-known/mcp`, {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
        signal: AbortSignal.timeout(20000),
    });
    const bareBody = await bare.json().catch(() => null);
    if (bareBody?.result?.protocolVersion) ok("MCP handshake without content-type");
    else fail("MCP handshake without content-type", `status ${bare.status}`);

    // Versioned alias answers.
    const v1 = await fetch(`${ORIGIN}/api/v1/content.json?limit=1`, {
        signal: AbortSignal.timeout(20000),
    });
    if (v1.status === 200) ok("/api/v1 alias");
    else fail("/api/v1 alias", `status ${v1.status}`);
}

// ---- live-only: crawler reachability + headers ------------------------
if (ORIGIN) {
    const UAS = [
        "GPTBot/1.1",
        "ClaudeBot/1.0",
        "ChatGPT-User/1.0",
        "PerplexityBot/1.0",
        "Google-Extended",
        "ora-agent",
        "DeepSeekBot/1.0",
    ];
    for (const ua of UAS) {
        const res = await fetch(`${ORIGIN}/?agentcheck=${Date.now()}`, {
            headers: { "user-agent": ua },
            signal: AbortSignal.timeout(20000),
        }).catch(() => null);
        if (!res) {
            fail(`crawler ${ua}`, "request timed out");
            continue;
        }
        if (res.status !== 200) fail(`crawler ${ua}`, `status ${res.status}`);
        else ok(`crawler ${ua}`);
    }

    const home = await fetch(ORIGIN + "/", { signal: AbortSignal.timeout(20000) });
    const link = home.headers.get("link") ?? "";
    for (const rel of ['rel="describedby"', 'rel="alternate"']) {
        if (!link.includes(rel)) fail(`Link header ${rel}`, `got "${link}"`);
        else ok(`Link header ${rel}`);
    }

    const md = await fetch(`${ORIGIN}/posts.md`, { signal: AbortSignal.timeout(20000) });
    if (!(md.headers.get("vary") ?? "").toLowerCase().includes("accept")) {
        fail("Vary: Accept on .md", `got "${md.headers.get("vary")}"`);
    } else ok("Vary: Accept on .md");
}

// ---- report ------------------------------------------------------------
console.log(
    `\n${passes} passed, ${failures} failed` +
        (skipped ? `, ${skipped} on-demand routes skipped (run with --url to check them)` : ""),
);
if (failures) {
    console.error("\nProblems:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
}
console.log("agent surface is intact.");
