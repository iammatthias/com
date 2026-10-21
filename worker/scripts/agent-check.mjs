#!/usr/bin/env node

// Ported from com/scripts/agent-check.mjs. The Worker renders everything
// on demand, so this only runs against a live origin (default: wrangler dev).
//   node scripts/agent-check.mjs [--url http://127.0.0.1:8796]

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const ORIGIN = (urlFlag >= 0 ? args[urlFlag + 1] : "http://127.0.0.1:8796").replace(/\/$/, "");

let failures = 0;
let passes = 0;
let skipped = 0;
const problems = [];

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

const { SECTION_SLUGS } = await import("../src/lib/agent-surface.ts").catch(
    () => ({ SECTION_SLUGS: ["art", "posts", "recipes", "melange", "experiments"] }),
);

const ON_DEMAND_PREFIXES = [
    "/tags",
    "/content",
    "/llms.txt",
    "/llms.md",
    "/index.md",
    "/rss.xml",
    "/sitemap",
    ...SECTION_SLUGS.map((s) => `/${s}`),
];

function onDemand(p) {
    const path = p.split("?")[0];
    return SSR_ONLY.has(path) || ON_DEMAND_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || path.startsWith(`${prefix}.`));
}

function ssrSkipped(p) {
    if (ORIGIN || !onDemand(p)) return false;
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

if (!ssrSkipped("/llms.txt")) {
    const r = await get("/llms.txt");
    const links = [...r.body.matchAll(/\]\(((?:https:\/\/(?:www\.)?iammatthias\.com)?\/[^)]*)\)/g)].map((m) => m[1]);
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
    if (paths.length === 0) fail("llms.txt links", "found no links to follow");
    else if (!broken) ok(`llms.txt: all ${paths.length} links resolve`);
}

if (ORIGIN) {
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

for (const s of SECTION_SLUGS) {
    await expectMarkdown(`/${s}/llms.txt`, `/${s}/llms.txt`);
    await expectMarkdown(`/${s}.md`, `/${s}.md`);
}

{
    const spec = await get("/openapi.json");
    if (spec.status === 200) {
        try {
            const d = JSON.parse(spec.body);
            for (const [p, ops] of Object.entries(d.paths ?? {})) {
                if (ssrSkipped(p)) continue;
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
        } catch (err) {
            fail("openapi paths", err.message);
        }
    }
}

if (ORIGIN) {
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

    const bot = await fetch(`${ORIGIN}/?bot=${Date.now()}`, {
        headers: { "user-agent": "ClaudeBot/1.0", accept: "text/html" },
        signal: AbortSignal.timeout(20000),
    });
    if ((bot.headers.get("content-type") ?? "").includes("markdown")) {
        ok("bot-UA gets markdown");
    } else fail("bot-UA markdown", bot.headers.get("content-type") ?? "none");

    const bare = await fetch(`${ORIGIN}/.well-known/mcp`, {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
        signal: AbortSignal.timeout(20000),
    });
    const bareBody = await bare.json().catch(() => null);
    if (bareBody?.result?.protocolVersion) ok("MCP handshake without content-type");
    else fail("MCP handshake without content-type", `status ${bare.status}`);

    const v1 = await fetch(`${ORIGIN}/api/v1/content.json?limit=1`, {
        signal: AbortSignal.timeout(20000),
    });
    if (v1.status === 200) ok("/api/v1 alias");
    else fail("/api/v1 alias", `status ${v1.status}`);
}

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

// com-next additions: the shell, the app API, and the is-agentic follow-ups.
{
    const card = await get("/.well-known/mcp/server-card.json");
    try {
        const d = JSON.parse(card.body);
        const remote = d.remotes?.find((r) => r.type === "streamable-http");
        if (!remote?.url) fail("server-card remotes", "no streamable-http remote url");
        else {
            const u = new URL(remote.url);
            const res = await fetch(ORIGIN + u.pathname, {
                method: "POST",
                headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: remote.supportedProtocolVersions?.[0], capabilities: {}, clientInfo: { name: "agent-check", version: "1" } } }),
            });
            const body = await res.json().catch(() => null);
            if (body?.result?.protocolVersion === remote.supportedProtocolVersions?.[0]) ok("MCP handshake via server-card remote");
            else fail("MCP handshake via server-card remote", `status ${res.status} ${JSON.stringify(body)?.slice(0, 120)}`);
        }
    } catch (e) {
        fail("server-card", e.message);
    }

    const did = await fetch(`${ORIGIN}/.well-known/atproto-did`);
    const didBody = await did.text();
    if (did.status === 200 && /^did:plc:[a-z0-9]+\n$/.test(didBody)) ok("/.well-known/atproto-did");
    else fail("/.well-known/atproto-did", `status ${did.status} ${JSON.stringify(didBody.slice(0, 60))}`);

    // com/public/_headers stamps the discovery Link on every asset; redirects carry it too.
    for (const path of ["/robots.txt", "/favicon.svg", "/rss.xml.xsl", "/openapi.json", "/schema.graphql", "/api/search-vectors.json", "/.well-known/api-catalog", "/.well-known/ai-catalog.json", "/.well-known/atproto-did", "/feed/"]) {
        const res = await fetch(ORIGIN + path, { method: "HEAD", redirect: "manual" });
        if ((res.headers.get("link") ?? "").includes('</llms.txt>; rel="describedby"')) ok(`Link on ${path}`);
        else fail(`Link on ${path}`, `status ${res.status}, link "${res.headers.get("link")}"`);
    }

    const robots = await fetch(`${ORIGIN}/robots.txt`, { method: "HEAD" });
    const etag = robots.headers.get("etag");
    const again = etag ? await fetch(`${ORIGIN}/robots.txt`, { headers: { "if-none-match": etag } }) : null;
    if (again?.status === 304) ok("ETag revalidation on /robots.txt");
    else fail("ETag revalidation on /robots.txt", `etag ${etag}, status ${again?.status}`);

    for (const path of ["/mcp", "/.well-known/mcp"]) {
        const res = await fetch(ORIGIN + path, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "agent-check", version: "1" } } }),
        });
        const body = await res.json().catch(() => null);
        if (body?.result?.protocolVersion) ok(`MCP initialize at ${path}`);
        else fail(`MCP initialize at ${path}`, `status ${res.status}`);
    }

    {
        const page = await (await fetch(`${ORIGIN}/posts`)).text();
        const ssr = await (await fetch(`${ORIGIN}/api/app/ssr?path=%2Fposts`)).json().catch(() => null);
        const main = page.match(/<main id="ssr">([\s\S]*)<\/main><\/div>/)?.[1];
        if (ssr?.kind === "ssr" && main !== undefined && ssr.html === main) ok("/api/app/ssr html matches <main id=\"ssr\">");
        else fail("/api/app/ssr html matches <main id=\"ssr\">", ssr ? `kind ${ssr.kind}, ${ssr.html?.length} vs ${main?.length} chars` : "no JSON");
    }

    const llms = await get("/llms.txt");
    for (const needle of ["/developers.md", "/openapi.json", "/mcp"]) {
        if (!llms.body.includes(needle)) fail("llms.txt dev resources", `missing ${needle}`);
        else ok(`llms.txt lists ${needle}`);
    }
    const dev = await get("/developers");
    if (!/id="versioning"/.test(dev.body)) fail("/developers versioning note", "no #versioning section");
    else ok("/developers versioning note");
    // com never published dated sunset commitments; the note must not invent any.
    if (/Sunset|Deprecation header|\b20\d\d-\d\d-\d\d\b/.test(dev.body.match(/id="versioning"[\s\S]*?(?=<h2|$)/)?.[0] ?? "")) {
        fail("/developers versioning note", "mentions sunset headers or dates");
    } else ok("/developers versioning note is undated");

    const gql = await fetch(`${ORIGIN}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "{documents(first:1){nodes{id}}}" }),
    });
    await gql.body?.cancel();
    if (!gql.headers.has("deprecation") && !gql.headers.has("sunset")) ok("no invented Deprecation/Sunset headers on GraphQL");
    else fail("no invented Deprecation/Sunset headers on GraphQL", `deprecation "${gql.headers.get("deprecation")}", sunset "${gql.headers.get("sunset")}"`);

    const home = await fetch(ORIGIN + "/");
    const html = await home.text();
    const csp = home.headers.get("content-security-policy") ?? "";
    for (const needle of ["'wasm-unsafe-eval'", "worker-src 'self' blob:"]) {
        if (!csp.includes(needle)) fail("shell CSP", `missing ${needle}`);
        else ok(`shell CSP ${needle}`);
    }
    if (home.headers.has("set-cookie")) fail("shell", "HTML sets a cookie; it must stay edge-cacheable");
    else ok("shell sets no cookie");
    if (!/<main id="ssr">[\s\S]*<h1>/.test(html)) fail("shell SSR", "no <main id=\"ssr\"> with an <h1>");
    else ok("shell SSR content");
    if (!/canvas\{position:fixed!important;inset:0;z-index:1/.test(html)) fail("shell canvas pin", "missing");
    else ok("shell canvas pin");
    if (!/<script type="module">[\s\S]*_bg\.wasm/.test(html)) fail("shell app bundle", "no wasm bootstrap");
    else ok("shell app bundle");
    if (!/<noscript>/.test(html)) fail("shell noscript", "missing");
    else ok("shell noscript");

    const idx = await get("/api/app/index");
    try {
        const d = JSON.parse(idx.body);
        if (!Array.isArray(d.sections) || !Array.isArray(d.items) || !Array.isArray(d.feed) || !Array.isArray(d.elsewhere)) fail("/api/app/index", "missing arrays");
        else ok(`/api/app/index (${d.items.length} items)`);
        const first = d.items[0];
        if (first) {
            const r = JSON.parse((await get(`/api/app/route?path=${encodeURIComponent(first.href)}`)).body);
            if (r.kind !== "doc" || typeof r.doc?.markdown !== "string") fail("/api/app/route doc", JSON.stringify(r).slice(0, 120));
            else ok("/api/app/route doc");
            const img = Object.entries(r.doc.media).find(([, m]) => m.mime.startsWith("image/"));
            if (img) {
                const res = await fetch(`${ORIGIN}/img/${img[0]}?w=480`);
                await res.body?.cancel();
                if (res.status === 200 && res.headers.get("access-control-allow-origin") === "*") ok("/img proxy");
                else fail("/img proxy", `status ${res.status}`);
            }
        }
        for (const [p, kind] of [["/open-source", "redirect"], ["/nope-nope", "notfound"], ["/feed", "feed"], ["/tags", "tags"], ["/about", "page"], ["/content", "content"], ["/", "home"]]) {
            const r = JSON.parse((await get(`/api/app/route?path=${encodeURIComponent(p)}`)).body);
            if (r.kind !== kind) fail(`/api/app/route ${p}`, `kind ${r.kind}, expected ${kind}`);
            else ok(`/api/app/route ${p} -> ${kind}`);
        }
    } catch (e) {
        fail("/api/app", e.message);
    }
}

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
