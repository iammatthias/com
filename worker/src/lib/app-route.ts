import type {
    AppDoc,
    AppFeedSummary,
    AppGlassPick,
    AppIndex,
    AppItem,
    AppMediaMap,
    AppPost,
    AppRoute,
    AppSection,
    AppSeriesMap,
    AppTimeline,
    AppTimelineItem,
    SeriesLayout,
} from "../app-api";
import {
    getBlobMeta,
    getSeries,
    livePublications,
    loadAllFeedEntries,
    publicationSlugSet,
    renderKey,
    seriesIndex,
    seriesKeyFor,
    stampedHref,
    type DocumentData,
    type FeedEntryData,
    type PublicationData,
} from "./farfield-loader";
import { documentForRoute, documentsByTag, publishedDocs } from "./content-query";
import { memo } from "./memo";
import { extractBodyEmbeds } from "./embeds";
import { excerptOf } from "./agent-data";
import { plainText } from "./markdown-text";
import { readingTime } from "./toc";
import { getPage, parsePageParam, PAGE_SIZE } from "./pagination";
import { redirectFor, type RedirectDeps } from "./redirects";
import { TRIPTYCH_SERIES, tokenizeSeries } from "./doc-render";
import { SOCIAL_LINKS } from "./identity";
import {
    DEVELOPERS_HEADING,
    DEVELOPERS_LEDE,
    DEVELOPERS_QUICKSTART,
    HOME_INTRO,
    NOW_BIO,
    NOW_FIND_ME,
    NOW_RECENT_LIMIT,
    NOW_WORKING,
    RESUME,
    STATIC_PAGES,
    developersEndpoints,
    developersSections,
    menuGroups,
} from "../pages/static";
import { glassPick, type GlassPick } from "./glass";

export const redirectDeps: RedirectDeps = {
    publications: publicationSlugSet,
    stampedHref,
};

/** com's home feed column. */
export const LATEST_FEED_COUNT = 3;
/** com's home waits this long for glass.photo before drawing an empty arch. */
const GLASS_TIMEOUT_MS = 1000;
const GLASS_PROFILE = SOCIAL_LINKS.find((l) => l.name === "Glass")?.url ?? "https://glass.photo/iam";

export function toAppGlassPick(pick: GlassPick | null): AppGlassPick | null {
    if (!pick) return null;
    return {
        href: pick.shareUrl ?? GLASS_PROFILE,
        // straight from wsrv.nl in the browser; the app falls back to /api/app/glass-image
        image: pick.src,
        width: pick.width,
        height: pick.height,
        ...(pick.prominentColor && { prominentColor: pick.prominentColor }),
        caption: {
            ...(pick.description && { title: pick.description }),
            ...(pick.seriesTitle && { series: pick.seriesTitle }),
            ...(pick.equipment && { equipment: pick.equipment }),
            ...(pick.settings && { settings: pick.settings }),
            ...(pick.captureDate && { date: pick.captureDate }),
        },
    };
}

function glassPickWithin(ms: number): Promise<GlassPick | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
        glassPick().catch(() => null),
        new Promise<null>((resolve) => {
            timer = setTimeout(() => resolve(null), ms);
        }),
    ]).finally(() => clearTimeout(timer));
}

export function toAppItem(d: DocumentData): AppItem {
    return {
        title: d.title,
        href: d.href,
        section: d.collection,
        publishedAt: d.publishedAt,
        excerpt: excerptOf(d),
        tags: d.tags,
        cid: d.cid,
    };
}

function toSection(p: PublicationData, count: number): AppSection {
    return {
        slug: p.slug,
        name: p.name,
        description: p.description?.trim() || null,
        count,
    };
}

const BLOB_REF = /blob:\/\/([a-z0-9-]+)/g;

function seriesLayout(slug: string, body: string): SeriesLayout {
    if (TRIPTYCH_SERIES.has(slug)) return "triptych";
    return tokenizeSeries(body).some((b) => b.type === "text") ? "flow" : "grid";
}

export async function collectMedia(
    body: string,
): Promise<{ media: AppMediaMap; series: AppSeriesMap }> {
    const slugs = [
        ...new Set(
            extractBodyEmbeds(body)
                .filter((e) => e.scheme === "series")
                .map((e) => e.id),
        ),
    ];
    const series: AppSeriesMap = {};
    const bodies = [body];
    const loaded = await Promise.all(slugs.map((s) => getSeries(s).catch(() => null)));
    slugs.forEach((slug, i) => {
        const s = loaded[i];
        if (!s?.body) return;
        series[slug] = {
            title: s.title?.trim() || null,
            body: s.body,
            layout: seriesLayout(slug, s.body),
        };
        bodies.push(s.body);
    });
    const cids = [
        ...new Set(bodies.flatMap((b) => [...b.matchAll(BLOB_REF)].map((m) => m[1]))),
    ];
    const metas = await Promise.all(cids.map((cid) => getBlobMeta(cid)));
    const media: AppMediaMap = {};
    cids.forEach((cid, i) => {
        const m = metas[i];
        media[cid] = {
            mime: m?.mime ?? "application/octet-stream",
            width: m?.width && m.width > 0 ? m.width : null,
            height: m?.height && m.height > 0 ? m.height : null,
            dominantColor: m?.dominantColor ?? null,
            blurhash: m?.blurhash ?? null,
            thumbCid: m?.thumbCid ?? null,
        };
    });
    return { media, series };
}

/**
 * The series fingerprint com keys renders on: `slug:cid` for every embedded
 * series, "" when the body embeds none. A series edit changes this but not
 * the embedding record's cid.
 */
export async function seriesKeyOf(body: string): Promise<string> {
    return body.includes("series://") ? seriesKeyFor(body, await seriesIndex()) : "";
}

/** com's renderId for a feed post (feed/[rkey].md.ts): the cid, plus the series fingerprint when it embeds one. */
export function postRenderKey(cid: string, seriesKey: string): string {
    return seriesKey ? `${cid}@${seriesKey}` : cid;
}

export async function toAppPost(item: FeedEntryData): Promise<AppPost> {
    const [{ media, series }, seriesKey] = await Promise.all([collectMedia(item.body), seriesKeyOf(item.body)]);
    return {
        rkey: item.rkey,
        cid: item.cid,
        renderKey: postRenderKey(item.cid, seriesKey),
        href: `/feed/${item.rkey}`,
        body: item.body,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        tags: item.tags,
        media,
        series,
    };
}

export function feedExcerpt(body: string): string {
    return plainText(body).slice(0, 200).trim();
}

/** Entries per page of the timeline: a screenful of spiral at a time. */
export const TIMELINE_PAGE = 40;

/** A feed note named by its first words, or, a picture alone, by when it was posted. */
export function noteTitle(body: string, createdAt: string): string {
    const words = plainText(body).replace(/\s+/g, " ").trim();
    if (!words) {
        const d = new Date(createdAt);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const date = Number.isNaN(d.getTime())
            ? createdAt.slice(0, 10)
            : `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        return `Photograph, ${date}`;
    }
    // a phrase, not a paragraph: the first sentence, or its first words
    const first = words.split(/(?<=[.!?])\s/)[0];
    if (first.length <= 44) return first.replace(/[.!?]$/, "");
    const cut = words.slice(0, 44);
    const sp = cut.lastIndexOf(" ");
    return `${sp > 20 ? cut.slice(0, sp) : cut}…`;
}

/** Every document and feed note, newest first, one page at a time. */
export async function appTimeline(page: number): Promise<AppTimeline> {
    // merged and sorted once a minute, shared by every page asked for meanwhile
    const all = await memo("app-timeline", async () => {
        const [docs, feed] = await Promise.all([publishedDocs(), loadAllFeedEntries()]);
        const merged: AppTimelineItem[] = [
            ...docs.map((d) => ({ title: d.title, href: d.href, kind: d.collection, at: d.publishedAt ?? "" })),
            ...feed.map((f) => ({ title: noteTitle(f.body, f.createdAt), href: `/feed/${f.rkey}`, kind: "feed", at: f.createdAt })),
        ];
        merged.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
        return merged;
    });
    const pages = Math.max(1, Math.ceil(all.length / TIMELINE_PAGE));
    const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
    return { items: all.slice((p - 1) * TIMELINE_PAGE, p * TIMELINE_PAGE), page: p, pages, total: all.length };
}

export async function appIndex(): Promise<AppIndex> {
    const [pubs, docs, feed, menu, pick] = await Promise.all([
        livePublications(),
        publishedDocs(),
        loadAllFeedEntries(),
        menuGroups(),
        glassPickWithin(GLASS_TIMEOUT_MS),
    ]);
    const counts = new Map<string, number>();
    for (const d of docs) counts.set(d.collection, (counts.get(d.collection) ?? 0) + 1);
    return {
        sections: pubs
            .filter((p) => (counts.get(p.slug) ?? 0) > 0)
            .map((p) => toSection(p, counts.get(p.slug) ?? 0)),
        items: docs.map(toAppItem),
        // every note (the list runs them by date with everything else); each is a few words
        feed: feed.map(
            (f): AppFeedSummary => ({
                rkey: f.rkey,
                href: `/feed/${f.rkey}`,
                excerpt: feedExcerpt(f.body),
                createdAt: f.createdAt,
            }),
        ),
        elsewhere: SOCIAL_LINKS.filter((l) => !l.schemaOnly).map((l) => ({
            label: l.name,
            href: l.url,
        })),
        menu: menu.map((g) => ({
            group: g.label ?? "",
            links: g.links.map((l) => ({ label: l.label, href: l.href })),
        })),
        latestFeed: await Promise.all(feed.slice(0, LATEST_FEED_COUNT).map(toAppPost)),
        glassPick: toAppGlassPick(pick),
        intro: HOME_INTRO,
    };
}

async function docRoute(pub: string, slug: string): Promise<AppRoute> {
    const found = await documentForRoute(pub, slug);
    if (!found) return { kind: "notfound" };
    const { doc, related } = found;
    const siblings = (await publishedDocs()).filter((d) => d.collection === doc.collection);
    const at = siblings.findIndex((d) => d.rkey === doc.rkey);
    const older = at >= 0 ? siblings[at + 1] : undefined;
    const newer = at > 0 ? siblings[at - 1] : undefined;
    const [{ media, series }, seriesKey] = await Promise.all([collectMedia(doc.body), seriesKeyOf(doc.body)]);
    const out: AppDoc = {
        title: doc.title,
        section: { slug: doc.publication.slug, name: doc.publication.name },
        rkey: doc.rkey,
        cid: doc.cid,
        renderKey: renderKey({ ...doc, seriesKey }),
        href: doc.href,
        publishedAt: doc.publishedAt,
        updatedAt: doc.updatedAt,
        tags: doc.tags,
        description: doc.description || plainText(doc.body).slice(0, 180).trim(),
        readingMinutes: readingTime(doc.body).minutes,
        markdown: doc.body,
        media,
        series,
        related: related.map((r) => ({
            title: r.title,
            href: r.href,
            section: r.collection,
            ...(r.description?.trim() && { description: r.description.trim() }),
            publishedAt: r.publishedAt,
        })),
        ...(older && { prev: { title: older.title, href: older.href } }),
        ...(newer && { next: { title: newer.title, href: newer.href } }),
    };
    return { kind: "doc", doc: out };
}

function pageNumber(rest: string | undefined): number | null {
    return parsePageParam(rest);
}

function decodeSegment(s: string): string | null {
    try {
        return decodeURIComponent(s);
    } catch {
        return null;
    }
}

/**
 * Resolve a human-facing URL path to the app payload. Mirrors the old
 * Astro route table: static pages win over dynamic ones, and dynamic
 * segments win over rest parameters.
 */
/** `redirects: false` when the caller has already run redirectFor on this path. */
export async function resolveAppRoute(
    pathname: string,
    search = "",
    { redirects = true }: { redirects?: boolean } = {},
): Promise<AppRoute> {
    const redirect = redirects ? await redirectFor(pathname, search, "GET", redirectDeps) : null;
    if (redirect) return { kind: "redirect", to: redirect.to, status: redirect.status };

    if (pathname === "/") return { kind: "home" };

    const segments = pathname.slice(1).split("/");
    const [first, ...restSegments] = segments;
    const rest = restSegments.length ? restSegments.join("/") : undefined;

    if (pathname === "/now") {
        const all = await loadAllFeedEntries().catch(() => []);
        return {
            kind: "now",
            title: "Now",
            bio: NOW_BIO,
            working: NOW_WORKING,
            recent: await Promise.all(all.slice(0, NOW_RECENT_LIMIT).map(toAppPost)),
            findMe: NOW_FIND_ME,
        };
    }

    if (pathname === "/resume") {
        return {
            kind: "resume",
            title: "Resume",
            sections: RESUME.map((s) => ({ title: s.section, entries: s.entries.map((e) => ({ ...e })) })),
        };
    }

    if (pathname === "/developers") {
        return {
            kind: "developers",
            title: DEVELOPERS_HEADING,
            lede: DEVELOPERS_LEDE,
            markdownHref: "/developers.md",
            quickstart: DEVELOPERS_QUICKSTART,
            endpoints: developersEndpoints(),
            sections: developersSections(),
        };
    }

    if (segments.length === 1 && STATIC_PAGES[first]) {
        const page = STATIC_PAGES[first];
        return {
            kind: "page",
            slug: page.slug,
            title: page.title,
            markdown: await page.markdown(),
        };
    }

    if (first === "content") {
        const [all, pubs] = await Promise.all([publishedDocs(), livePublications()]);
        let page = 1;
        if (rest !== undefined) {
            const m = /^page\/([^/]+)$/.exec(rest);
            const n = m ? Number(m[1]) : NaN;
            if (!m || !Number.isInteger(n) || n < 2 || String(n) !== m[1]) {
                return { kind: "notfound" };
            }
            page = n;
        }
        const paged = getPage(all, page, "/content");
        if (!paged) return { kind: "notfound" };
        return {
            kind: "content",
            page,
            pages: paged.totalPages,
            total: all.length,
            sections: pubs.map((p) => ({
                slug: p.slug,
                name: p.name,
                count: all.filter((d) => d.collection === p.slug).length,
            })),
            items: paged.items.map(toAppItem),
        };
    }

    if (first === "tags") {
        const byTag = await documentsByTag();
        if (rest === undefined) {
            const tags = [...byTag.entries()]
                .map(([tag, list]) => ({ tag, count: list.length }))
                .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
            return { kind: "tags", tags, total: tags.length };
        }
        const tag = decodeSegment(restSegments[0]);
        const page = pageNumber(restSegments.slice(1).join("/") || undefined);
        const items = tag === null ? undefined : byTag.get(tag);
        if (page === null || !items?.length || tag === null) return { kind: "notfound" };
        const paged = getPage(items, page, `/tags/${encodeURIComponent(tag)}`);
        if (!paged) return { kind: "notfound" };
        return {
            kind: "tag",
            tag,
            page,
            pages: paged.totalPages,
            total: items.length,
            items: paged.items.map(toAppItem),
        };
    }

    if (first === "feed") {
        const all = await loadAllFeedEntries();
        if (restSegments.length === 1 && restSegments[0] !== "") {
            const item = all.find((e) => e.rkey === restSegments[0]);
            if (!item) return { kind: "notfound" };
            return { kind: "post", post: await toAppPost(item) };
        }
        const page = pageNumber(rest);
        if (page === null) return { kind: "notfound" };
        const paged = getPage(all, page, "/feed");
        if (!paged) return { kind: "notfound" };
        return {
            kind: "feed",
            page,
            pages: paged.totalPages,
            total: all.length,
            posts: await Promise.all(paged.items.map(toAppPost)),
        };
    }

    const pubs = await livePublications();
    const pub = pubs.find((p) => p.slug === first);
    if (!pub) return { kind: "notfound" };

    if (restSegments.length === 1) {
        return docRoute(pub.slug, restSegments[0]);
    }

    const page = pageNumber(rest);
    if (page === null) return { kind: "notfound" };
    const items = (await publishedDocs()).filter((d) => d.collection === pub.slug);
    const paged = getPage(items, page, `/${pub.slug}`);
    if (!paged) return { kind: "notfound" };
    return {
        kind: "list",
        section: toSection(pub, items.length),
        page,
        pages: paged.totalPages,
        items: paged.items.map(toAppItem),
    };
}

export { PAGE_SIZE };
