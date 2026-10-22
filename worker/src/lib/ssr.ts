import { marked } from "marked";
import type { AppDevelopersRoute, AppItem, AppNowRoute, AppPost, AppResumeRoute, AppRoute } from "../app-api";
import type { PageHead } from "./seo";
import { escapeAttr, escapeHtml, fmtDate, fmtDateLong } from "./format";
import { cachedDocBody } from "./doc-body-cache";
import { buildToc } from "./toc";
import { pageHref } from "./pagination";
import { plainText, proseHtml } from "./markdown-text";
import { resolveBodyMedia, loadAllFeedEntries, type ResolvedMedia } from "./farfield-loader";
import { mediaSize } from "./media-size";
import { deckColumns } from "./deck";
import { STATIC_PAGES, SOCIAL_HREFS } from "../pages/static";
import { transformAlerts } from "./markdown-text";
import { seriesTags } from "./cache";
import { glassPick, type GlassPick } from "./glass";
import { SITE_IDENTITY } from "./agent-surface";

/**
 * Server-rendered semantic HTML for every human route. It sits in the
 * document under the GPUI canvas so crawlers, no-JS clients, and screen
 * readers get the same content the app paints.
 */

export type CachePolicy =
    | { kind: "document" }
    | { kind: "feed"; page?: number; edge: boolean; extraTags?: string[] }
    | { kind: "home" }
    | { kind: "now" }
    | { kind: "static" }
    | { kind: "long" }
    | { kind: "none" };

/**
 * /now lists the newest feed posts; /menu lists the publications. Every other
 * hand-written page changes only with a deploy, which purges `shell`.
 */
export function pageCachePolicy(slug: string): CachePolicy {
    if (slug === "now") return { kind: "now" };
    if (slug === "menu") return { kind: "document" };
    return { kind: "static" };
}

export interface SsrPage {
    head: PageHead;
    main: string;
    status: number;
    cache: CachePolicy;
}

const h = escapeHtml;
const a = escapeAttr;

const WSRV_BLOB =
    /https:\/\/wsrv\.nl\/\?url=https%3A%2F%2Fblobs\.farfield\.systems%2Fblobs%2F([a-z0-9-]+)&(?:amp;)?w=(\d+)&(?:amp;)?q=\d+&(?:amp;)?output=webp/g;

/** Point rendered images at the same-origin /img proxy the app also uses, so both share one cache. */
export function sameOriginImages(html: string): string {
    return html.replace(WSRV_BLOB, (_m, cid: string, w: string) => `/img/${cid}?w=${w}`);
}

function crumbs(items: Array<{ label: string; href?: string }>): string {
    if (!items.length) return "";
    return (
        `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>` +
        `<li><a href="/">home</a></li>` +
        items
            .map((c) =>
                c.href
                    ? `<li><a href="${a(c.href)}">${h(c.label)}</a></li>`
                    : `<li><span aria-current="page">${h(c.label)}</span></li>`,
            )
            .join("") +
        `</ol></nav>`
    );
}

function pagination(page: number, totalPages: number, basePath: string): string {
    if (totalPages <= 1) return "";
    const prev = page > 1 ? pageHref(basePath, page - 1) : null;
    const next = page < totalPages ? pageHref(basePath, page + 1) : null;
    const nums: string[] = [];
    for (let n = 1; n <= totalPages; n++) {
        nums.push(
            n === page
                ? `<li><a href="${a(pageHref(basePath, n))}" aria-current="page">${n}</a></li>`
                : `<li><a href="${a(pageHref(basePath, n))}">${n}</a></li>`,
        );
    }
    return (
        `<nav class="pagination" aria-label="Pagination">` +
        (prev ? `<a rel="prev" href="${a(prev)}">← Newer</a>` : "") +
        `<ol>${nums.join("")}</ol>` +
        (next ? `<a rel="next" href="${a(next)}">Older →</a>` : "") +
        `</nav>`
    );
}

function card(item: AppItem, kind?: string): string {
    return (
        `<li class="card"><a href="${a(item.href)}">` +
        (kind ? `<span class="card-kind">${h(kind)}</span>` : "") +
        `<h2>${h(item.title)}</h2>` +
        (item.excerpt ? `<p>${h(item.excerpt)}</p>` : "") +
        `<time datetime="${a(item.publishedAt)}">${h(fmtDate(item.publishedAt))}</time>` +
        `</a></li>`
    );
}

function feedMedia(media: ResolvedMedia[]): string {
    if (!media.length) return "";
    return (
        `<div class="feed-media">` +
        media
            .map((m) => {
                const mime = m.meta?.mime ?? "";
                const label = m.alt ? ` aria-label="${a(m.alt)}"` : "";
                const src = `https://blobs.farfield.systems/blobs/${m.cid}`;
                if (mime.startsWith("video/")) {
                    return `<figure><video controls preload="none" playsinline src="${a(src)}"${label}></video></figure>`;
                }
                if (mime.startsWith("audio/")) {
                    return `<figure><audio controls preload="none" src="${a(src)}"${label}></audio></figure>`;
                }
                const { width, height } = mediaSize(m.meta);
                return `<figure><img src="/img/${m.cid}?w=720" width="${width}" height="${height}" alt="${a(m.alt ?? "")}" loading="lazy" decoding="async"></figure>`;
            })
            .join("") +
        `</div>`
    );
}

async function feedItem(post: Pick<AppPost, "rkey" | "body" | "createdAt">): Promise<string> {
    const note = proseHtml(post.body);
    const media = await resolveBodyMedia(post.body);
    return (
        `<li class="feed-item">` +
        `<a href="/feed/${a(post.rkey)}"><time datetime="${a(post.createdAt)}">${h(fmtDate(post.createdAt))}</time></a>` +
        (note ? `<div class="feed-note">${note}</div>` : "") +
        feedMedia(media) +
        `</li>`
    );
}

function colophon(fields: Array<{ label: string; value: string; href?: string; datetime?: string }>): string {
    return (
        `<footer class="colophon"><dl>` +
        fields
            .map(
                (f) =>
                    `<div><dt>${h(f.label)}</dt><dd>` +
                    (f.href
                        ? `<a href="${a(f.href)}">${h(f.value)}</a>`
                        : f.datetime
                          ? `<time datetime="${a(f.datetime)}">${h(f.value)}</time>`
                          : h(f.value)) +
                    `</dd></div>`,
            )
            .join("") +
        `</dl></footer>`
    );
}

function relMe(html: string): string {
    return html.replace(/<a href="([^"]+)">/g, (m, href: string) =>
        SOCIAL_HREFS.has(href) ? `<a href="${href}" rel="me noopener">` : m,
    );
}

export function markdownHtml(md: string): string {
    return transformAlerts(marked.parse(md, { async: false }) as string);
}

/** com/src/components/GlassArch.astro: the home hero, an arch-framed Glass photograph. */
function glassArch(pick: GlassPick | null): string {
    const tint = pick?.prominentColor
        ? ` style="background: ${a(pick.prominentColor)}; border-color: ${a(pick.prominentColor)}"`
        : "";
    const details = pick ? [pick.equipment, pick.settings, pick.captureDate].filter((d): d is string => Boolean(d)) : [];
    const img = pick
        ? `<img src="${a(pick.src)}" srcset="${a(pick.srcset)}" sizes="${a(pick.sizes)}" width="${pick.width}" height="${pick.height}" alt="${a(pick.alt)}" loading="eager" decoding="async" fetchpriority="high">`
        : "";
    const caption =
        pick && (pick.seriesTitle || details.length)
            ? `<figcaption>` +
              (pick.seriesTitle
                  ? `<span class="title">` +
                    (pick.shareUrl ? `<a href="${a(pick.shareUrl)}" rel="noopener">${h(pick.seriesTitle)}</a>` : h(pick.seriesTitle)) +
                    `</span>`
                  : "") +
              details.map((d) => `<span>${h(d)}</span>`).join("") +
              `</figcaption>`
            : "";
    return `<figure class="hero"><div class="arch-frame"><div class="arch-window"${tint}>${img}</div></div>${caption}</figure>`;
}

/** The head every hand-written page carries, from its STATIC_PAGES entry. */
function staticHead(slug: string, path: string): PageHead {
    const page = STATIC_PAGES[slug];
    return {
        title: page.title,
        description: page.description,
        ogImage: page.ogImage,
        profilePage: page.profilePage,
        noindex: page.noindex,
        faq: page.faq,
        markdownHref: page.markdownHref,
        path,
    };
}

/** com/src/pages/now.astro: bio, working on, recent updates as real feed cards, find me. */
async function nowPage(route: AppNowRoute, path: string): Promise<SsrPage> {
    const all = await loadAllFeedEntries().catch(() => []);
    const items = await Promise.all(route.recent.map(feedItem));
    const html =
        `<h1>${h(route.title)}</h1>` +
        `<section class="bio">${markdownHtml(route.bio)}</section>` +
        `<section><h2>Working on</h2>${markdownHtml(route.working)}</section>` +
        `<section class="updates"><h2>Recent updates <a href="/feed" class="see-all">see all →</a></h2>` +
        (items.length ? `<ul class="feed feed--compact">${items.join("")}</ul>` : `<p class="feed-empty">Nothing recent.</p>`) +
        `</section>` +
        `<section><h2>Find me</h2><ul class="links">` +
        route.findMe
            .map((l) => `<li><a href="${a(l.href)}" rel="me noopener">${h(l.label)} <span class="username">${h(l.username)}</span></a></li>`)
            .join("") +
        `</ul></section>`;
    return {
        head: staticHead("now", path),
        main: `<article class="prose">${relMe(buildToc(html).html)}</article>`,
        status: 200,
        cache: pageCachePolicy("now"),
    };
}

/** com/src/pages/resume.astro: one <dl> of company / date / position per section. */
function resumePage(route: AppResumeRoute, path: string): SsrPage {
    const html =
        `<h1>${h(route.title)}</h1>` +
        route.sections
            .map(
                (s) =>
                    `<section><h2>${h(s.title)}</h2><dl>` +
                    s.entries
                        .map(
                            (e) =>
                                `<div class="entry"><dt>${e.href ? `<a href="${a(e.href)}">${h(e.company)}</a>` : h(e.company)}</dt>` +
                                `<dd class="date">${h(e.date)}</dd><dd class="position">${h(e.position)}</dd></div>`,
                        )
                        .join("") +
                    `</dl></section>`,
            )
            .join("");
    return {
        head: staticHead("resume", path),
        main: `<article class="prose">${buildToc(html).html}</article>`,
        status: 200,
        cache: pageCachePolicy("resume"),
    };
}

/** com/src/pages/developers.astro: header, quickstart, the endpoint <dl>, then the prose sections. */
function developersPage(route: AppDevelopersRoute, path: string): SsrPage {
    const [endpointsNote, ...rest] = route.sections;
    const section = (title: string, inner: string) => `<section><h2>${h(title)}</h2>${inner}</section>`;
    const html =
        section("Quickstart", `<pre><code>${h(route.quickstart)}</code></pre>`) +
        section(
            "HTTP endpoints",
            `<dl>` +
                route.endpoints.map((e) => `<dt><code>${h(e.label)}</code></dt><dd>${h(e.description)}</dd>`).join("") +
                `</dl>` +
                (endpointsNote ? markdownHtml(endpointsNote.body) : ""),
        ) +
        rest.map((s) => section(s.title, markdownHtml(s.body))).join("");
    return {
        head: staticHead("developers", path),
        main:
            `<header class="page-header"><h1>${h(route.title)}</h1>${markdownHtml(route.lede)}` +
            `<p class="meta"><a href="${a(route.markdownHref)}">this page as markdown</a></p></header>` +
            `<section class="prose">${buildToc(html).html}</section>`,
        status: 200,
        cache: pageCachePolicy("developers"),
    };
}

export function notFoundPage(path: string): SsrPage {
    return {
        head: { title: "Not found", description: "That page doesn't exist.", noindex: true, path },
        main:
            `<article class="not-found"><p class="kind">404</p><h1>Not found</h1>` +
            `<p>That page doesn't exist — or it moved during the redesign.</p>` +
            `<p>Try the <a href="/">homepage</a>, browse <a href="/content">all content</a> or the <a href="/feed">feed</a>, or wander the <a href="/tags">tag index</a>.</p>` +
            `</article>`,
        status: 404,
        cache: { kind: "none" },
    };
}

export async function renderRoute(route: AppRoute, path: string): Promise<SsrPage> {
    switch (route.kind) {
        case "home": {
            const [columns, pick, feed] = await Promise.all([
                deckColumns(),
                Promise.race([
                    glassPick().catch(() => null),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
                ]),
                loadAllFeedEntries().catch(() => []),
            ]);
            const latest = feed.slice(0, 3);
            const items = await Promise.all(latest.map(feedItem));
            return {
                head: { path },
                main:
                    `<div class="home">` +
                    `<section class="home-static" aria-label="Introduction">` +
                    glassArch(pick) +
                    `<div class="home-intro intro"><h1>Hi, I am Matthias.</h1>` +
                    `<p>This is my cozy corner on the web. A collection of photographs, projects, recipes, and notes.</p></div></section>` +
                    (latest.length
                        ? `<section aria-labelledby="home-feed-heading"><h2 id="home-feed-heading"><a href="/feed">feed</a> <span>${feed.length}</span></h2>` +
                          `<ul class="feed">${items.join("")}</ul><a href="/feed">all ${feed.length} →</a></section>`
                        : "") +
                    `<section aria-label="Collections">` +
                    columns
                        .map(
                            (c) =>
                                `<section><h2><a href="${a(c.href)}">${h(c.label)}</a> <span>${c.total}</span></h2><ul>` +
                                c.peek
                                    .map(
                                        (p) =>
                                            `<li><a href="${a(p.href)}">${h(p.title)}</a> <time datetime="${a(p.date)}">${h(fmtDate(p.date))}</time></li>`,
                                    )
                                    .join("") +
                                `</ul><a href="${a(c.href)}">all ${c.total} →</a></section>`,
                        )
                        .join("") +
                    `</section></div>`,
                status: 200,
                cache: { kind: "home" },
            };
        }

        case "doc": {
            const d = route.doc;
            const body = await cachedDocBody({ cid: d.cid, body: d.markdown });
            const { html: bodyHtml, entries } = buildToc(sameOriginImages(body));
            const md = `${d.href}.md`;
            const toc =
                entries.length >= 2 && d.section.slug !== "art"
                    ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>` +
                      entries.map((e) => `<li class="toc-level-${e.level}"><a href="#${a(e.id)}">${h(e.text)}</a></li>`).join("") +
                      `</ul></nav>`
                    : "";
            const main =
                crumbs([{ label: d.section.name.toLowerCase(), href: `/${d.section.slug}` }]) +
                `<article class="doc">` +
                `<header class="doc-hero"><h1>${h(d.title)}</h1>` +
                `<p class="dateline"><time datetime="${a(d.publishedAt)}">${h(fmtDateLong(d.publishedAt))}</time>` +
                ` · by <a href="/about" rel="author">${h(SITE_IDENTITY.owner)}</a>` +
                (d.readingMinutes > 0 ? ` · <span>${d.readingMinutes} min read</span>` : "") +
                `</p>` +
                (d.tags.length
                    ? `<ul class="tags">${d.tags.map((t) => `<li><a href="/tags/${a(encodeURIComponent(t))}">${h(t)}</a></li>`).join("")}</ul>`
                    : "") +
                `</header>` +
                toc +
                `<div class="doc-body">${bodyHtml}</div>` +
                colophon([
                    { label: "collection", value: d.section.slug },
                    { label: "rkey", value: d.rkey },
                    { label: "record cid", value: d.cid },
                    { label: "source", value: md, href: md },
                    { label: "published", value: d.publishedAt, datetime: d.publishedAt },
                    { label: "updated", value: d.updatedAt, datetime: d.updatedAt },
                ]) +
                (d.related.length
                    ? `<section class="doc-related" aria-label="Related posts"><h2>Related</h2><ul>` +
                      d.related.map((r) => `<li><a href="${a(r.href)}">${h(r.title)}</a> <span>${h(r.section)}</span></li>`).join("") +
                      `</ul></section>`
                    : "") +
                (d.prev || d.next
                    ? `<nav class="doc-nav" aria-label="More in ${a(d.section.name)}">` +
                      (d.next ? `<a rel="next" href="${a(d.next.href)}">← ${h(d.next.title)}</a> ` : "") +
                      (d.prev ? `<a rel="prev" href="${a(d.prev.href)}">${h(d.prev.title)} →</a>` : "") +
                      `</nav>`
                    : "") +
                `</article>`;
            return {
                head: {
                    title: d.title,
                    description: d.description,
                    ogImage: `/${d.section.slug}/${encodeURIComponent(d.title)}`,
                    ogType: "article",
                    article: { publishedTime: d.publishedAt, modifiedTime: d.updatedAt },
                    breadcrumbs: [{ label: d.section.name.toLowerCase(), href: `/${d.section.slug}` }],
                    markdownHref: md,
                    path,
                },
                main,
                status: 200,
                cache: { kind: "document" },
            };
        }

        case "list": {
            const { section: s, page, pages, items } = route;
            const base = `/${s.slug}`;
            return {
                head: {
                    title: page > 1 ? `${s.name} — page ${page}` : s.name,
                    description: s.description ?? `${s.name} — iammatthias`,
                    ogImage: `/${s.slug}`,
                    markdownHref: `/${s.slug}.md`,
                    pagination: {
                        prev: page > 1 ? pageHref(base, page - 1) : null,
                        next: page < pages ? pageHref(base, page + 1) : null,
                    },
                    path,
                },
                main:
                    `<header class="page-header"><h1>${h(s.name)}</h1>` +
                    (s.description ? `<p>${h(s.description)}</p>` : "") +
                    `<p class="meta"><a href="/${a(s.slug)}/rss.xml">RSS</a> · <span>${s.count} ${s.count === 1 ? "entry" : "entries"}</span></p></header>` +
                    (s.count === 0
                        ? `<p>No entries published yet.</p>`
                        : `<ul class="grid">${items.map((i) => card(i)).join("")}</ul>` + pagination(page, pages, base)),
                status: 200,
                cache: { kind: "document" },
            };
        }

        case "feed": {
            const { page, pages, posts, total } = route;
            const items = await Promise.all(posts.map(feedItem));
            return {
                head: {
                    title: page > 1 ? `Feed — page ${page}` : "Feed",
                    description: "Short posts from iammatthias.",
                    ogImage: "/feed",
                    markdownHref: "/feed.md",
                    path,
                },
                main:
                    `<header class="page-header"><h1>Feed</h1><p>Short posts from iammatthias.</p>` +
                    `<p class="meta"><a href="/feed/rss.xml">RSS</a> · <span>${total} ${total === 1 ? "entry" : "entries"}</span></p></header>` +
                    (total === 0 ? `<p>Nothing recent.</p>` : `<ul class="feed">${items.join("")}</ul>`) +
                    pagination(page, pages, "/feed"),
                status: 200,
                cache: { kind: "feed", page, edge: true, extraTags: seriesTags(posts) },
            };
        }

        case "post": {
            const p = route.post;
            const text = plainText(p.body);
            const note = proseHtml(p.body);
            const media = await resolveBodyMedia(p.body);
            const md = `/feed/${p.rkey}.md`;
            return {
                head: {
                    title: text.slice(0, 60).trim() || `Entry ${p.rkey}`,
                    description: text.slice(0, 180).trim() || "Feed entry.",
                    ogType: "article",
                    article: { publishedTime: p.createdAt, modifiedTime: p.updatedAt },
                    markdownHref: md,
                    path,
                },
                main:
                    `<article class="entry"><header class="entry-hero">` +
                    `<h1>${h(text.slice(0, 60).trim() || `Entry ${p.rkey}`)}</h1>` +
                    `<p class="dateline"><time datetime="${a(p.createdAt)}">${h(fmtDateLong(p.createdAt))}</time></p>` +
                    (note ? `<div class="feed-note">${note}</div>` : "") +
                    `</header>` +
                    feedMedia(media) +
                    colophon([
                        { label: "collection", value: "feed" },
                        { label: "id", value: p.rkey },
                        { label: "record cid", value: p.cid },
                        { label: "source", value: md, href: md },
                        { label: "created", value: p.createdAt, datetime: p.createdAt },
                        { label: "updated", value: p.updatedAt, datetime: p.updatedAt },
                    ]) +
                    `</article>`,
                status: 200,
                cache: { kind: "feed", edge: true, extraTags: seriesTags([p]) },
            };
        }

        case "tags":
            return {
                head: { title: "Tags", description: "All tags across the site, by frequency.", path },
                main:
                    `<header class="page-header"><h1>Tags</h1><p>${route.tags.length} unique tags across the archive.</p></header>` +
                    (route.tags.length === 0
                        ? `<p>No tags yet.</p>`
                        : `<ul class="tag-cloud">` +
                          route.tags
                              .map(
                                  (t) =>
                                      `<li><a href="/tags/${a(encodeURIComponent(t.tag))}"><span class="tag-name">${h(t.tag)}</span> <span class="tag-count">${t.count}</span></a></li>`,
                              )
                              .join("") +
                          `</ul>`),
                status: 200,
                cache: { kind: "document" },
            };

        case "tag": {
            const { tag, page, pages, items, total } = route;
            const base = `/tags/${encodeURIComponent(tag)}`;
            return {
                head: {
                    title: page > 1 ? `#${tag} — page ${page}` : `#${tag}`,
                    description: `Entries tagged ${tag} — iammatthias.`,
                    breadcrumbs: [{ label: "tags", href: "/tags" }, { label: tag }],
                    pagination: {
                        prev: page > 1 ? pageHref(base, page - 1) : null,
                        next: page < pages ? pageHref(base, page + 1) : null,
                    },
                    path,
                },
                main:
                    crumbs([{ label: "tags", href: "/tags" }, { label: tag }]) +
                    `<header class="page-header"><h1>${h(tag)}</h1>` +
                    `<p class="meta"><a href="${a(base)}/rss.xml">RSS</a> · <span>${total} ${total === 1 ? "entry" : "entries"}</span></p></header>` +
                    `<ul class="grid">${items.map((i) => card(i, i.section)).join("")}</ul>` +
                    pagination(page, pages, base),
                status: 200,
                cache: { kind: "document" },
            };
        }

        case "content": {
            const { page, pages, items, total, sections } = route;
            return {
                head: {
                    title: page > 1 ? `Content — page ${page}` : "Content",
                    description: `Browse all ${total} entries across publications.`,
                    ogImage: "/content",
                    pagination: {
                        prev: page > 1 ? pageHref("/content", page - 1) : null,
                        next: page < pages ? pageHref("/content", page + 1) : null,
                    },
                    path,
                },
                main:
                    `<header class="page-header"><h1>Content</h1><p>${total} entries across ${sections.length} publications: ` +
                    sections.map((p) => `<a href="/${a(p.slug)}">${h(p.name.toLowerCase())}</a>`).join(", ") +
                    `.</p></header>` +
                    `<ul class="grid">${items.map((i) => card(i, i.section)).join("")}</ul>` +
                    pagination(page, pages, "/content"),
                status: 200,
                cache: { kind: "document" },
            };
        }

        case "page": {
            const page = STATIC_PAGES[route.slug];
            return {
                head: staticHead(page.slug, path),
                main: `<article class="prose">${relMe(buildToc(markdownHtml(route.markdown)).html)}</article>`,
                status: 200,
                cache: pageCachePolicy(page.slug),
            };
        }

        case "now":
            return nowPage(route, path);

        case "resume":
            return resumePage(route, path);

        case "developers":
            return developersPage(route, path);

        case "notfound":
        case "redirect":
            return notFoundPage(path);
    }
}
