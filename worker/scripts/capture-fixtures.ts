// Capture the app API contract fixtures from a running `wrangler dev`.
// Usage: bun scripts/capture-fixtures.ts [origin]   (default http://127.0.0.1:8796)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const origin = (process.argv[2] ?? "http://127.0.0.1:8796").replace(/\/$/, "");
const out = join(import.meta.dir, "..", "fixtures", "app-api");
mkdirSync(out, { recursive: true });

async function get(path: string): Promise<any> {
    const res = await fetch(origin + path);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
}

const route = (path: string) => `/api/app/route?path=${encodeURIComponent(path)}`;
const ssr = (path: string) => `/api/app/ssr?path=${encodeURIComponent(path)}`;

const index = await get("/api/app/index");
const feed = await get(route("/feed"));
const postWithMedia = feed.posts.find((p: any) => Object.keys(p.media).length > 0) ?? feed.posts[0];

const cases: Array<[string, string]> = [
    ["index", "/api/app/index"],
    ["home", route("/")],
    ["doc", route("/posts/1779066375000-farfield")],
    ["doc-series-grid", route("/art/1791519648658-datamosh")],
    ["doc-series-triptych", route("/art/1781816428977-phosphene")],
    ["doc-recipe", route("/recipes/1710031406664-pizza-dough")],
    ["doc-component", route("/posts/1788199665000-whats-the-frequency-kenneth")],
    ["doc-callout", route("/posts/1712432046964-generate-a-new-private-key")],
    ["list", route("/posts")],
    ["list-page-2", route("/posts/page/2")],
    ["feed", route("/feed")],
    ["feed-page-2", route("/feed/page/2")],
    ["post", route(postWithMedia.href)],
    ["tags", route("/tags")],
    ["tag", route("/tags/llms")],
    ["page", route("/about")],
    ["now", route("/now")],
    ["resume", route("/resume")],
    ["developers", route("/developers")],
    ["content", route("/content")],
    ["content-page-2", route("/content/page/2")],
    ["redirect", route("/open-source")],
    ["redirect-unstamped", route("/posts/farfield")],
    ["redirect-trailing-slash", route("/posts/")],
    ["notfound", route("/definitely-not-a-page")],
    ["ssr-doc", ssr("/posts/1779066375000-farfield")],
    ["ssr-notfound", ssr("/definitely-not-a-page")],
    ["ssr-redirect", ssr("/posts/farfield")],
];

for (const [name, path] of cases) {
    const body = name === "index" ? index : name === "feed" ? feed : await get(path);
    writeFileSync(join(out, `${name}.json`), JSON.stringify(body, null, 2) + "\n");
    console.log(`${name.padEnd(24)} ${body.kind ?? "index"}  ${path}`);
}
