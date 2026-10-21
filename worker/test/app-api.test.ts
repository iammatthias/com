import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppIndex, AppRoute, AppSsr } from "../src/app-api";
import { IMG_WIDTHS } from "../src/app-api";
import { snapWidth } from "../src/routes/app";
import { renderKey, seriesKeyFor } from "../src/lib/render-key";
import { noteTitle, postRenderKey } from "../src/lib/app-route";
import { seriesTags } from "../src/lib/cache";
import { API_OPERATIONS } from "../src/lib/agent-surface";
import { toAppGlassPick } from "../src/lib/app-route";
import type { GlassPick } from "../src/lib/glass";
import { renderRoute } from "../src/lib/ssr";
import { STATIC_PAGES } from "../src/pages/static";

const DIR = join(import.meta.dir, "..", "fixtures", "app-api");
const load = (name: string) => JSON.parse(readFileSync(join(DIR, name), "utf8"));

type Check = (v: unknown, at: string) => void;
const fail = (at: string, why: string): never => {
    throw new Error(`${at}: ${why}`);
};
const str: Check = (v, at) => void (typeof v === "string" || fail(at, `expected string, got ${typeof v}`));
const num: Check = (v, at) => void (typeof v === "number" || fail(at, `expected number, got ${typeof v}`));
const iso: Check = (v, at) => {
    str(v, at);
    if (Number.isNaN(Date.parse(v as string))) fail(at, "not a timestamp");
};
const path: Check = (v, at) => {
    str(v, at);
    if (!(v as string).startsWith("/")) fail(at, "not a site-relative path");
};
const nullable = (c: Check): Check => (v, at) => void (v === null || c(v, at));
const optional = (c: Check): Check => (v, at) => void (v === undefined || c(v, at));
const arr = (c: Check): Check => (v, at) => {
    if (!Array.isArray(v)) fail(at, "expected array");
    (v as unknown[]).forEach((x, i) => c(x, `${at}[${i}]`));
};
const record = (c: Check): Check => (v, at) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) fail(at, "expected object");
    for (const [k, x] of Object.entries(v as object)) c(x, `${at}.${k}`);
};
const obj = (shape: Record<string, Check>, exact = true): Check => (v, at) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) fail(at, "expected object");
    const o = v as Record<string, unknown>;
    for (const [k, c] of Object.entries(shape)) c(o[k], `${at}.${k}`);
    if (exact) for (const k of Object.keys(o)) if (!(k in shape)) fail(at, `unexpected key ${k}`);
};
const oneOf = (...vals: unknown[]): Check => (v, at) =>
    void (vals.includes(v) || fail(at, `expected one of ${vals.join("|")}, got ${String(v)}`));

const item = obj({ title: str, href: path, section: str, publishedAt: iso, excerpt: str, tags: arr(str), cid: str });
const section = obj({ slug: str, name: str, description: nullable(str), count: num });
const media = record(
    obj({
        mime: str,
        width: nullable(num),
        height: nullable(num),
        dominantColor: nullable(str),
        blurhash: nullable(str),
        thumbCid: nullable(str),
    }),
);
const series = record(obj({ title: nullable(str), body: str, layout: oneOf("grid", "flow", "triptych") }));
const neighbor = obj({ title: str, href: path });
const doc = obj({
    title: str,
    section: obj({ slug: str, name: str }),
    rkey: str,
    cid: str,
    renderKey: str,
    href: path,
    publishedAt: iso,
    updatedAt: iso,
    tags: arr(str),
    description: str,
    readingMinutes: num,
    markdown: str,
    media,
    series,
    related: arr(obj({ title: str, href: path, section: str, description: optional(str), publishedAt: optional(iso) })),
    prev: optional(neighbor),
    next: optional(neighbor),
});
const post = obj({
    rkey: str,
    cid: str,
    renderKey: str,
    href: path,
    body: str,
    createdAt: iso,
    updatedAt: iso,
    tags: arr(str),
    media,
    series,
});
const paged = { page: num, pages: num };
const link = obj({ label: str, href: str });
const glassPick = obj({
    href: str,
    image: str,
    width: optional(num),
    height: optional(num),
    prominentColor: optional(str),
    caption: obj({
        title: optional(str),
        series: optional(str),
        equipment: optional(str),
        settings: optional(str),
        date: optional(str),
    }),
});

const ROUTE: Record<AppRoute["kind"], Check> = {
    home: obj({ kind: str }),
    doc: obj({ kind: str, doc }),
    list: obj({ kind: str, section, ...paged, items: arr(item) }),
    feed: obj({ kind: str, ...paged, total: num, posts: arr(post) }),
    post: obj({ kind: str, post }),
    tags: obj({ kind: str, tags: arr(obj({ tag: str, count: num })), total: num }),
    tag: obj({ kind: str, tag: str, ...paged, total: num, items: arr(item) }),
    page: obj({ kind: str, slug: str, title: str, markdown: str }),
    now: obj({
        kind: str,
        title: oneOf("Now"),
        bio: str,
        working: str,
        recent: arr(post),
        findMe: arr(obj({ label: str, href: str, username: str })),
    }),
    resume: obj({
        kind: str,
        title: oneOf("Resume"),
        sections: arr(
            obj({
                title: str,
                entries: arr(obj({ company: str, date: str, position: str, href: optional(str) })),
            }),
        ),
    }),
    developers: obj({
        kind: str,
        title: str,
        lede: str,
        markdownHref: path,
        quickstart: str,
        endpoints: arr(obj({ label: str, href: path, description: str })),
        sections: arr(obj({ title: str, body: str })),
    }),
    content: obj({
        kind: str,
        ...paged,
        total: num,
        sections: arr(obj({ slug: str, name: str, count: num })),
        items: arr(item),
    }),
    redirect: obj({ kind: str, to: path, status: oneOf(301, 302) }),
    notfound: obj({ kind: str }),
};

const ssrPage = obj({
    kind: oneOf("ssr"),
    status: oneOf(200, 404),
    title: str,
    description: str,
    canonical: nullable(str),
    noindex: (v, at) => void (typeof v === "boolean" || fail(at, "expected boolean")),
    og: obj({ title: str, description: str, image: str, url: str, type: oneOf("website", "article") }),
    html: str,
});

const all = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const ssrFiles = all.filter((f) => f.startsWith("ssr-"));
const files = all.filter((f) => !f.startsWith("ssr-"));

describe("app API fixtures match src/app-api.ts", () => {
    test("there is a fixture for every route kind", () => {
        const kinds = new Set(files.filter((f) => f !== "index.json").map((f) => load(f).kind));
        expect([...kinds].sort()).toEqual(Object.keys(ROUTE).sort());
    });

    test("index.json", () => {
        const d = load("index.json") as AppIndex;
        obj({
            sections: arr(section),
            items: arr(item),
            feed: arr(obj({ rkey: str, href: path, excerpt: str, createdAt: iso })),
            elsewhere: arr(obj({ label: str, href: str })),
            menu: arr(obj({ group: str, links: arr(link) })),
            latestFeed: arr(post),
            glassPick: nullable(glassPick),
            intro: str,
        })(d, "index");
        expect(d.feed.length).toBeLessThanOrEqual(20);
        expect(d.latestFeed.map((p) => p.rkey)).toEqual(d.feed.slice(0, 3).map((f) => f.rkey));
        expect(d.menu.map((g) => g.group)).toEqual(["", "publications", "archive", "personal", "other"]);
        expect(d.menu[0].links).toEqual([{ label: "home", href: "/" }]);
        expect(d.menu.find((g) => g.group === "publications")!.links.map((l) => l.href)).toEqual(
            d.sections.map((s) => `/${s.slug}`),
        );
        expect(d.intro.startsWith("Hi, I am Matthias.")).toBe(true);
        const dates = d.items.map((i) => i.publishedAt);
        expect(dates).toEqual([...dates].sort().reverse());
        for (const s of d.sections) {
            expect(s.count).toBe(d.items.filter((i) => i.section === s.slug).length);
        }
    });

    for (const f of files.filter((f) => f !== "index.json")) {
        test(f, () => {
            const d = load(f) as AppRoute;
            const check = ROUTE[d.kind];
            expect(check).toBeDefined();
            check(d, f);
            if (d.kind === "doc") {
                const { cid, publishedAt, updatedAt } = d.doc;
                expect(d.doc.renderKey.startsWith(`${cid}@${publishedAt}@${updatedAt}@`)).toBe(true);
                for (const slug of Object.keys(d.doc.series)) expect(d.doc.renderKey).toContain(`${slug}:`);
                for (const m of d.doc.markdown.matchAll(/blob:\/\/([a-z0-9-]+)/g)) {
                    expect(d.doc.media[m[1]]).toBeDefined();
                }
                for (const m of d.doc.markdown.matchAll(/series:\/\/([a-z0-9-]+)/g)) {
                    expect(d.doc.series[m[1]]).toBeDefined();
                    for (const b of d.doc.series[m[1]].body.matchAll(/blob:\/\/([a-z0-9-]+)/g)) {
                        expect(d.doc.media[b[1]]).toBeDefined();
                    }
                }
            }
            const posts = d.kind === "feed" ? d.posts : d.kind === "post" ? [d.post] : [];
            for (const p of posts) {
                expect(p.renderKey.split("@")[0]).toBe(p.cid);
                expect(p.renderKey === p.cid).toBe(!p.body.includes("series://"));
            }
            if (d.kind === "feed" || d.kind === "tag" || d.kind === "content") {
                const shown = d.kind === "feed" ? d.posts.length : d.items.length;
                expect(d.total).toBeGreaterThanOrEqual(shown);
                if (d.page < d.pages) expect(shown).toBe(12);
                expect(d.total).toBeGreaterThan((d.pages - 1) * 12);
                expect(d.total).toBeLessThanOrEqual(d.pages * 12);
            }
            if (d.kind === "content") {
                expect(d.sections.reduce((n, s) => n + s.count, 0)).toBe(d.total);
            }
            if (d.kind === "tags") {
                expect(d.total).toBe(d.tags.length);
                expect(new Set(d.tags.map((t) => t.tag)).size).toBe(d.total);
                const counts = d.tags.map((t) => t.count);
                expect(counts).toEqual([...counts].sort((x, y) => y - x));
            }
            if (d.kind === "doc") {
                for (const r of d.doc.related) expect(r.publishedAt).toBeDefined();
            }
            if ("page" in d && "pages" in d) {
                expect(d.page).toBeGreaterThanOrEqual(1);
                expect(d.page).toBeLessThanOrEqual(d.pages);
            }
        });
    }

    test("now carries com's sections and the 5 newest posts", () => {
        const d = load("now.json");
        expect(d.recent.length).toBe(5);
        expect(d.bio.startsWith("Hi, I am Matthias.")).toBe(true);
        expect(d.working).toContain("[recipes](/recipes)");
        expect(d.findMe.length).toBeGreaterThan(0);
        const feed = load("feed.json");
        expect(d.recent.map((p: { rkey: string }) => p.rkey)).toEqual(
            feed.posts.slice(0, 5).map((p: { rkey: string }) => p.rkey),
        );
    });

    test("resume has com's three sections", () => {
        const d = load("resume.json");
        expect(d.sections.map((s: { title: string }) => s.title)).toEqual(["Present", "Historic", "Education"]);
        expect(d.sections[0].entries[0]).toEqual({ company: "Stablecore", date: "2026 → Current", position: "Solutions Engineer" });
    });

    test("developers lists every API operation and com's sections in order", () => {
        const d = load("developers.json");
        expect(d.endpoints.map((e: { href: string }) => e.href)).toEqual(API_OPERATIONS.map((o) => o.path));
        expect(d.endpoints[0].label).toBe(`GET ${API_OPERATIONS[0].path}`);
        expect(d.markdownHref).toBe("/developers.md");
        expect(d.quickstart.startsWith("# Search the site")).toBe(true);
        expect(d.quickstart).not.toContain("```");
        expect(d.sections.map((s: { title: string }) => s.title)).toEqual([
            "HTTP endpoints",
            "MCP server",
            "Markdown twins",
            "Versioning",
            "Everything else",
            "Caching and etiquette",
            "FAQ",
        ]);
    });

    test("docs keep the raw stored markdown", () => {
        expect(load("doc-recipe.json").doc.markdown).toContain("```recipe");
        expect(load("doc-component.json").doc.markdown).toMatch(/<ff-[a-z]/);
        expect(load("doc-series-grid.json").doc.markdown).toContain("series://");
        expect(load("doc-series-triptych.json").doc.series.phosphene.layout).toBe("triptych");
    });
});

describe("/api/app/ssr fixtures match AppSsr", () => {
    for (const f of ssrFiles) {
        test(f, () => {
            const d = load(f) as AppSsr;
            if (d.kind === "redirect") return ROUTE.redirect(d, f);
            ssrPage(d, f);
            expect(d.html.startsWith("<noscript>")).toBe(true);
            expect(d.og.url.startsWith("https://iammatthias.com/")).toBe(true);
            expect(d.canonical === null).toBe(d.noindex);
            expect(d.title.endsWith("iammatthias")).toBe(true);
        });
    }

    test("cover a page, a 404, and a redirect", () => {
        const kinds = ssrFiles.map((f) => {
            const d = load(f) as AppSsr;
            return d.kind === "ssr" ? `ssr-${d.status}` : d.kind;
        });
        expect(kinds.sort()).toEqual(["redirect", "ssr-200", "ssr-404"]);
    });
});

describe("renderKey (com/src/lib/render-key.ts)", () => {
    const doc = {
        cid: "bafy",
        publishedAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        publication: { name: "Art", description: "Pictures" },
    };
    const body = "intro\n\n![](series://datamosh)\n";

    test("a series edit changes the key while the entry cid stays put", () => {
        const before = renderKey({ ...doc, seriesKey: seriesKeyFor(body, new Map([["datamosh", "cid-a"]])) });
        const after = renderKey({ ...doc, seriesKey: seriesKeyFor(body, new Map([["datamosh", "cid-b"]])) });
        expect(before).toBe("bafy@2026-01-01T00:00:00Z@2026-01-02T00:00:00Z@datamosh:cid-a@Art|Pictures");
        expect(after).not.toBe(before);
    });

    test("no series: no fingerprint segment", () => {
        expect(renderKey({ ...doc, seriesKey: "" })).toBe("bafy@2026-01-01T00:00:00Z@2026-01-02T00:00:00Z@Art|Pictures");
    });

    test("posts use com's feed renderId", () => {
        expect(postRenderKey("bafy", "")).toBe("bafy");
        expect(postRenderKey("bafy", "datamosh:cid-a")).toBe("bafy@datamosh:cid-a");
    });

    test("feed payloads that embed a series carry the documents purge tag", () => {
        expect(seriesTags([{ body: "just text" }])).toEqual([]);
        expect(seriesTags([{ body: "x" }, { body: body }])).toEqual(["documents"]);
    });
});

describe("SSR for the hand-written kinds keeps the page's head", () => {
    test("resume renders com's <dl> per section", async () => {
        const page = await renderRoute(load("resume.json"), "/resume");
        expect(page.head.title).toBe(STATIC_PAGES.resume.title);
        expect(page.head.ogImage).toBe("/resume");
        expect(page.main).toContain(`<h2 id="historic">Historic</h2><dl>`);
        expect(page.main).toContain(
            `<div class="entry"><dt>Stablecore</dt><dd class="date">2026 → Current</dd><dd class="position">Solutions Engineer</dd></div>`,
        );
        expect(page.main.match(/<dl>/g)?.length).toBe(3);
    });

    test("developers renders quickstart, endpoints, then every section", async () => {
        const route = load("developers.json");
        const page = await renderRoute(route, "/developers");
        expect(page.head.markdownHref).toBe("/developers.md");
        expect(page.head.faq).toBe(STATIC_PAGES.developers.faq);
        expect(page.main).toContain(`<h1>iammatthias.com developer documentation</h1>`);
        expect(page.main).toContain(`<dt><code>GET ${API_OPERATIONS[0].path}</code></dt>`);
        expect(page.main).toContain("openapi.json");
        for (const s of route.sections) expect(page.main).toContain(`>${s.title}</h2>`);
        expect(page.main.indexOf(">Quickstart</h2>")).toBeLessThan(page.main.indexOf(">MCP server</h2>"));
    });
});

describe("glassPick (com GlassArch)", () => {
    const pick: GlassPick = {
        src: "https://wsrv.nl/?url=x&w=960",
        srcset: "",
        sizes: "",
        width: 1080,
        height: 1620,
        alt: "Big Trees",
        description: null,
        prominentColor: "#a38553",
        seriesTitle: "Big Trees",
        shareUrl: null,
        equipment: "Canon EOS R",
        settings: null,
        captureDate: "June 23, 2026",
    };

    test("maps to the app shape, dropping empty caption lines", () => {
        expect(toAppGlassPick(pick)).toEqual({
            href: "https://glass.photo/iam",
            image: "https://wsrv.nl/?url=x&w=960",
            width: 1080,
            height: 1620,
            prominentColor: "#a38553",
            caption: { series: "Big Trees", equipment: "Canon EOS R", date: "June 23, 2026" },
        });
    });

    test("links the post when Glass has a share url, and carries its description", () => {
        const out = toAppGlassPick({ ...pick, shareUrl: "https://glass.photo/iam/abc", description: "Redwoods" })!;
        expect(out.href).toBe("https://glass.photo/iam/abc");
        expect(out.caption.title).toBe("Redwoods");
        expect(toAppGlassPick(null)).toBeNull();
    });
});

describe("/img width presets", () => {
    test("snaps up to the next preset and caps at the largest", () => {
        expect(snapWidth("700")).toBe(720);
        expect(snapWidth("720")).toBe(720);
        expect(snapWidth("1")).toBe(IMG_WIDTHS[0]);
        expect(snapWidth("99999")).toBe(2560);
        expect(snapWidth(null)).toBe(1920);
        expect(snapWidth("abc")).toBe(1920);
    });
});

describe("timeline note titles", () => {
    test("a picture alone is named by its date", () => {
        expect(noteTitle("![](blob://x)", "2026-10-09T15:31:11Z")).toBe("Photograph, 9 Oct 2026");
    });
    test("a note is its first sentence, or its first words", () => {
        expect(noteTitle("California skies are hard to beat. More words follow here.", "2026-01-01T00:00:00Z")).toBe("California skies are hard to beat");
        const long = noteTitle("Once upon a time, in the long long ago of the early internet, there were forums", "2026-01-01T00:00:00Z");
        expect(long.endsWith("…")).toBe(true);
        expect(long.length).toBeLessThanOrEqual(45);
    });
});
