
import { marked } from "marked";
import { blobURL, getBlobMeta, getSeries } from "./farfield-loader";
import type { DocumentData } from "./farfield-loader";
import {
    BLOB_ID_SOURCE,
    fullEmbedRe,
    wsrvUrl,
    wsrvSrcSet,
    type BlobMeta,
} from "./farfield";
import { mapWithConcurrency } from "./http";
import { plainText, transformAlerts } from "./markdown-text";
import { escapeAttr as attr } from "./format";
import {
    extractDocComponents,
    substituteDocComponents,
} from "./doc-components/transform";
import { extractRecipes, recipeHtml, recipeSimpleHtml } from "./recipe";
import {
    FIG_WIDTHS,
    FIG_SIZES,
    SERIES_WIDTHS,
    SERIES_SIZES,
    ZOOM_WIDTHS,
    ZOOM_QUALITY,
    ZOOM_SIZES,
    ZOOM_FALLBACK_WIDTH,
} from "./images";

function rewriteBlobLinks(markdown: string): string {
    return markdown.replace(
        new RegExp(`\\]\\(${BLOB_ID_SOURCE}\\)`, "g"),
        (_m, cid: string) => `](${blobURL(cid)})`,
    );
}

function zoomAttrs(src: string, alt: string, w: number, h: number): string {
    return (
        `data-zoom-src="${attr(wsrvUrl(src, ZOOM_FALLBACK_WIDTH, { quality: ZOOM_QUALITY }))}" ` +
        `data-zoom-srcset="${attr(wsrvSrcSet(src, ZOOM_WIDTHS, { quality: ZOOM_QUALITY }))}" ` +
        `data-zoom-sizes="${attr(ZOOM_SIZES)}" ` +
        `data-zoom-alt="${attr(alt)}" ` +
        `data-zoom-w="${w}" data-zoom-h="${h}"`
    );
}

type MediaKind = "image" | "video" | "audio";

function mediaKind(meta: BlobMeta | null): MediaKind {
    const mime = meta?.mime ?? "";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "image";
}

function videoTag(cid: string, alt: string): string {
    const src = attr(blobURL(cid));
    const label = alt ? ` aria-label="${attr(alt)}"` : "";
    return (
        `<video controls preload="metadata" playsinline${label} src="${src}">` +
        `<a href="${src}">Watch the video</a>` +
        `</video>`
    );
}

function audioTag(cid: string, alt: string): string {
    const src = attr(blobURL(cid));
    const label = alt ? ` aria-label="${attr(alt)}"` : "";
    return (
        `<audio controls preload="metadata"${label} src="${src}">` +
        `<a href="${src}">Listen to the audio</a>` +
        `</audio>`
    );
}

function renderMediaFigure(
    figureClass: string,
    kind: "video" | "audio",
    cid: string,
    alt: string,
): string {
    const inner = kind === "video" ? videoTag(cid, alt) : audioTag(cid, alt);
    return `<figure class="${figureClass} ${figureClass}--${kind}">${inner}</figure>`;
}

function renderEmbedFigure(
    cid: string,
    alt: string,
    meta: BlobMeta | null,
): string {
    const kind = mediaKind(meta);
    if (kind !== "image") return renderMediaFigure("doc-figure", kind, cid, alt);
    const src = blobURL(cid);
    const w = meta?.width ?? 960;
    const h = meta?.height ?? 720;
    const styleAttr = meta?.dominantColor
        ? ` style="background:${meta.dominantColor}"`
        : "";
    return (
        `<figure class="doc-figure"${styleAttr}>` +
        `<button type="button" class="zoom-btn" ${zoomAttrs(src, alt, w, h)} aria-label="View image larger">` +
        `<img src="${wsrvUrl(src, 960)}" srcset="${wsrvSrcSet(src, FIG_WIDTHS)}" ` +
        `sizes="${FIG_SIZES}" width="${w}" height="${h}" ` +
        `alt="${attr(alt)}" loading="lazy" decoding="async" />` +
        `</button>` +
        `</figure>`
    );
}

function renderSeriesTile(
    cid: string,
    alt: string,
    meta: BlobMeta | null,
): string {
    const kind = mediaKind(meta);
    if (kind !== "image") return renderMediaFigure("series-tile", kind, cid, alt);
    const src = blobURL(cid);
    const w = meta?.width ?? 960;
    const h = meta?.height ?? 720;
    const styleAttr = meta?.dominantColor
        ? ` style="background:${meta.dominantColor}"`
        : "";
    return (
        `<figure class="series-tile"${styleAttr}>` +
        `<button type="button" class="zoom-btn" ${zoomAttrs(src, alt, w, h)} aria-label="View image larger">` +
        `<img src="${wsrvUrl(src, 640)}" srcset="${wsrvSrcSet(src, SERIES_WIDTHS)}" ` +
        `sizes="${SERIES_SIZES}" width="${w}" height="${h}" ` +
        `alt="${attr(alt)}" loading="lazy" decoding="async" />` +
        `</button>` +
        `</figure>`
    );
}

interface SeriesBlock {
    type: "media" | "text";
    cid?: string;
    alt?: string;
    raw: string;
}

function tokenizeSeries(body: string): SeriesBlock[] {
    const EMBED = new RegExp(`^!\\[([^\\]]*)\\]\\(${BLOB_ID_SOURCE}\\)$`);
    return body
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((raw): SeriesBlock => {
            const m = raw.match(EMBED);
            return m
                ? { type: "media", alt: m[1], cid: m[2], raw }
                : { type: "text", raw };
        });
}

const TRIPTYCH_SERIES = new Set(["phosphene"]);

function renderStanza(raw: string): string {
    const inner = raw
        .split("\n")
        .map((l) => l.replace(/^\s*>\s?/, ""))
        .join("\n");
    const html = transformAlerts(marked.parse(inner, { async: false }) as string);
    return html.replace(
        /<p><em>([\s\S]*?)<\/em><\/p>(\s*)$/,
        '<p class="stanza-note">$1</p>$2',
    );
}

async function renderSeriesTriptychs(blocks: SeriesBlock[]): Promise<string> {
    const metas = new Map<string, BlobMeta | null>();
    await Promise.all(
        blocks
            .filter((b) => b.type === "media")
            .map(async (b) => {
                metas.set(b.cid as string, await getBlobMeta(b.cid as string));
            }),
    );
    const tile = (b: SeriesBlock) =>
        renderSeriesTile(
            b.cid as string,
            b.alt ?? "",
            metas.get(b.cid as string) ?? null,
        );

    const out: string[] = [];
    let i = 0;
    while (i < blocks.length) {
        if (blocks[i].type !== "media") {
            out.push(
                `<p class="triptych-loose">${renderStanza(blocks[i].raw)}</p>`,
            );
            i++;
            continue;
        }
        const left = blocks[i++];
        const textParts: SeriesBlock[] = [];
        while (i < blocks.length && blocks[i].type !== "media")
            textParts.push(blocks[i++]);
        const right =
            i < blocks.length && blocks[i].type === "media"
                ? blocks[i++]
                : null;
        const capParts: SeriesBlock[] = [];
        while (i < blocks.length && blocks[i].type !== "media")
            capParts.push(blocks[i++]);

        const textHtml = textParts.map((t) => renderStanza(t.raw)).join("\n");
        const capHtml = capParts.map((c) => renderStanza(c.raw)).join("\n");

        out.push(
            `<figure class="triptych">` +
                `<div class="triptych__pair">` +
                    `<div class="triptych__img">${tile(left)}</div>` +
                    (right
                        ? `<div class="triptych__img">${tile(right)}</div>`
                        : "") +
                `</div>` +
                `<div class="triptych__text">${textHtml}</div>` +
                (capHtml
                    ? `<figcaption class="triptych__caption">${capHtml}</figcaption>`
                    : "") +
                `</figure>`,
        );
    }
    return out.join("");
}

async function renderSeriesFlow(blocks: SeriesBlock[]): Promise<string> {
    const parts = await Promise.all(
        blocks.map(async (b) => {
            if (b.type === "media") {
                const meta = await getBlobMeta(b.cid as string);
                return renderEmbedFigure(b.cid as string, b.alt ?? "", meta);
            }
            const html = marked.parse(b.raw, { async: false }) as string;
            return transformAlerts(html);
        }),
    );
    return parts.join("\n");
}

async function renderSeries(slug: string): Promise<string> {
    const series = await getSeries(slug);
    if (!series?.body) return "";
    const blocks = tokenizeSeries(series.body);
    const images = blocks.filter((b) => b.type === "media");
    const hasText = blocks.some((b) => b.type === "text");
    if (images.length === 0 && !hasText) return "";

    if (TRIPTYCH_SERIES.has(slug)) return renderSeriesTriptychs(blocks);
    if (hasText) return renderSeriesFlow(blocks);

    const metas = await Promise.all(
        images.map((b) => getBlobMeta(b.cid as string)),
    );
    const tiles = images
        .map((b, i) => renderSeriesTile(b.cid as string, b.alt ?? "", metas[i]))
        .join("");
    return `<div class="series-grid">${tiles}</div>`;
}

function substituteRecipes(
    html: string,
    blocks: string[],
    render: (src: string) => string,
): string {
    blocks.forEach((src, i) => {
        const out = render(src);
        html = html
            .replaceAll(`<p><!--ffrecipe${i}--></p>`, out)
            .replaceAll(`<!--ffrecipe${i}-->`, out);
    });
    return html;
}

export async function renderMarkdownBody(body: string): Promise<string> {
    const { body: lifted, blocks: recipes } = extractRecipes(body);
    const components = await extractDocComponents(
        lifted,
        "site",
        renderMarkdownBody,
    );
    interface Embed { alt: string; scheme: "blob" | "series"; id: string }
    const embeds: Embed[] = [];
    const preprocessed = components.source.replace(
        fullEmbedRe(),
        (_match, alt: string, scheme: string, id: string) => {
            const idx = embeds.length;
            embeds.push({ alt, scheme: scheme as "blob" | "series", id });
            return `\n\n<!--FARFIELD_EMBED:${idx}-->\n\n`;
        },
    );

    const rendered = await Promise.all(
        embeds.map(async (e) => {
            if (e.scheme === "series") {
                return renderSeries(e.id);
            }
            const meta = await getBlobMeta(e.id);
            return renderEmbedFigure(e.id, e.alt, meta);
        }),
    );

    let html = marked.parse(rewriteBlobLinks(preprocessed), {
        async: false,
    }) as string;

    html = html.replace(
        /<!--FARFIELD_EMBED:(\d+)-->/g,
        (_, idx: string) => rendered[Number(idx)] ?? "",
    );
    html = substituteDocComponents(html, components.rendered);
    html = substituteRecipes(html, recipes, recipeHtml);
    html = transformAlerts(html);
    return html;
}

export const RSS_ITEM_CAP = 25;

export const FEED_ENVELOPE = {
    xmlns: { media: "http://search.yahoo.com/mrss/" },
    customData: "<language>en-us</language>",
    stylesheet: "/rss.xml.xsl",
} as const;

export async function docFeedItems(items: DocumentData[], origin: string) {
    return mapWithConcurrency(items, 8, async (item) => {
        const canonical = `${origin}${item.href}`;
        const content = await renderFeedBody(item.body, {
            maxImages: 6,
            moreUrl: canonical,
        });
        const thumb = content.match(/<img src="([^"]+)"/)?.[1];
        return {
            title: item.title,
            description: item.description,
            content,
            link: item.href,
            pubDate: new Date(item.publishedAt),
            categories: [item.publication.name, ...item.tags],
            ...(thumb && {
                customData: `<media:content url="${thumb}" medium="image" />`,
            }),
        };
    });
}

export async function renderFeedBody(
    body: string,
    opts: { maxImages?: number; moreUrl?: string } = {},
): Promise<string> {
    const maxImages = opts.maxImages ?? Number.POSITIVE_INFINITY;

    const { body: lifted, blocks: recipes } = extractRecipes(body);
    const components = await extractDocComponents(
        lifted,
        "feed",
        (source) => renderFeedBody(source),
    );
    interface Embed { alt: string; scheme: "blob" | "series"; id: string }
    const embeds: Embed[] = [];
    const preprocessed = components.source.replace(
        fullEmbedRe(),
        (_match, alt: string, scheme: string, id: string) => {
            const idx = embeds.length;
            embeds.push({ alt, scheme: scheme as "blob" | "series", id });
            return `\n\n<!--FARFIELD_EMBED:${idx}-->\n\n`;
        },
    );

    const mediaTag = (m: { cid: string; alt: string }, meta: BlobMeta | null) => {
        switch (mediaKind(meta)) {
            case "video":
                return `<p>${videoTag(m.cid, m.alt)}</p>`;
            case "audio":
                return `<p>${audioTag(m.cid, m.alt)}</p>`;
            default:
                return `<p><img src="${attr(wsrvUrl(blobURL(m.cid), 960))}" alt="${attr(m.alt)}" /></p>`;
        }
    };

    const resolved = await Promise.all(
        embeds.map(async (e): Promise<{ cid: string; alt: string }[]> => {
            if (e.scheme === "blob") return [{ cid: e.id, alt: e.alt }];
            const series = await getSeries(e.id);
            if (!series?.body) return [];
            return [...series.body.matchAll(
                new RegExp(`!\\[([^\\]]*)\\]\\(${BLOB_ID_SOURCE}\\)`, "g"),
            )].map((m) => ({ cid: m[2], alt: m[1] }));
        }),
    );

    let emitted = 0;
    let omitted = 0;
    const rendered = await Promise.all(
        resolved.map(async (media) => {
            const take = media.slice(0, Math.max(0, maxImages - emitted));
            emitted += take.length;
            omitted += media.length - take.length;
            const metas = await Promise.all(
                take.map((m) => getBlobMeta(m.cid)),
            );
            return take.map((m, i) => mediaTag(m, metas[i])).join("\n");
        }),
    );

    let html = marked.parse(rewriteBlobLinks(preprocessed), {
        async: false,
    }) as string;
    html = html.replace(
        /<!--FARFIELD_EMBED:(\d+)-->/g,
        (_, idx: string) => rendered[Number(idx)] ?? "",
    );
    html = substituteDocComponents(html, components.rendered);
    html = substituteRecipes(html, recipes, recipeSimpleHtml);
    html = transformAlerts(html);
    if (omitted > 0 && opts.moreUrl) {
        html += `<p><a href="${attr(opts.moreUrl)}">View the full gallery (${omitted} more) →</a></p>`;
    }
    return html;
}

export function readingTime(body: string | undefined): {
    words: number;
    minutes: number;
} {
    if (!body) return { words: 0, minutes: 0 };
    const words = plainText(body).split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return { words, minutes };
}

export interface TocEntry {
    id: string;
    text: string;
    level: 2 | 3;
}

export function buildToc(html: string): {
    html: string;
    entries: TocEntry[];
} {
    const entries: TocEntry[] = [];
    const decodeEntities = (s: string) =>
        s
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#x?([0-9a-fA-F]+);/g, (_m, code: string) =>
                String.fromCodePoint(
                    code.startsWith("x") || code.startsWith("X")
                        ? parseInt(code.slice(1), 16)
                        : parseInt(code, 10),
                ),
            );
    const slug = (s: string) =>
        decodeEntities(s)
            .toLowerCase()
            .replace(/<[^>]+>/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "section";
    const used = new Set<string>();
    const dedupe = (base: string) => {
        let id = base;
        let n = 2;
        while (used.has(id)) id = `${base}-${n++}`;
        used.add(id);
        return id;
    };
    const out = html.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
        (match, lvl, attrs: string, inner: string) => {
            if (/\bclass=["'][^"']*ff-recipe/.test(attrs)) return match;
            const idMatch = attrs.match(/\bid=["']([^"']+)["']/);
            const id = idMatch ? idMatch[1] : dedupe(slug(inner));
            const level = Number(lvl) as 2 | 3;
            const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
            entries.push({ id, text, level });
            if (idMatch) return match;
            return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
        },
    );
    return { html: out, entries };
}
