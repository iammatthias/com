// Markdown → HTML pipeline for Farfield document bodies. Extracted
// from pages/[publication]/[slug].astro so the page keeps only its
// routing/data concerns and other surfaces can share the pieces.
//
// The pipeline resolves Farfield's two custom URI schemes into rich
// markup — `blob://<cid>` becomes a zoomable `<figure>`, and
// `series://<slug>` becomes a masonry gallery, a text+image flow, or
// the bespoke triptych layout depending on the series' shape — then
// rewrites GFM alert blockquotes into semantic callouts.

import { marked } from "marked";
import { blobURL, getBlobMeta, getSeries } from "./farfield-loader";
import { wsrvUrl, wsrvSrcSet, type BlobMeta } from "./farfield";
import { plainText, transformAlerts } from "./markdown-text";
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

/** Escape a string for safe inclusion inside an HTML attribute value. */
function attr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
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

/**
 * `<figure>` for a single inline blob. Width/height/dominantColor come
 * from the blob's `/meta` endpoint when available — gives the browser
 * a stable aspect-ratio box and a placeholder fill before the wsrv
 * variant lands. `meta === null` means the blob exists (URL still
 * works) but has no recorded metadata; we render with safe defaults.
 */
function renderEmbedFigure(
    cid: string,
    alt: string,
    meta: BlobMeta | null,
): string {
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

/** A `<figure>` tile inside a series gallery — narrower srcset. */
function renderSeriesTile(
    cid: string,
    alt: string,
    meta: BlobMeta | null,
): string {
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

/**
 * A series body is markdown made of blank-line-separated blocks. We
 * tokenize it in document order — image embeds vs everything else —
 * so prose between images is preserved instead of dropped.
 */
interface SeriesBlock {
    type: "image" | "text";
    /** blob cid (image blocks). */
    cid?: string;
    /** alt text (image blocks). */
    alt?: string;
    /** raw markdown (text blocks). */
    raw: string;
}

function tokenizeSeries(body: string): SeriesBlock[] {
    const IMG = /^!\[([^\]]*)\]\(blob:\/\/([a-z0-9]+)\)$/;
    return body
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((raw): SeriesBlock => {
            const m = raw.match(IMG);
            return m
                ? { type: "image", alt: m[1], cid: m[2], raw }
                : { type: "text", raw };
        });
}

// Series that get the bespoke triptych layout (image · text · image).
// Everything else renders generically — see `renderSeries`.
const TRIPTYCH_SERIES = new Set(["phosphene"]);

/** Render a text block from a series body as markdown. Strips any
 *  blockquote `> ` markers first so a poem/quote renders as centered
 *  prose — emphasis, hard line breaks, and paragraph splits intact —
 *  rather than a bordered blockquote. */
function renderStanza(raw: string): string {
    const inner = raw
        .split("\n")
        .map((l) => l.replace(/^\s*>\s?/, ""))
        .join("\n");
    const html = transformAlerts(marked.parse(inner, { async: false }) as string);
    // A trailing paragraph that is wholly emphasised (authored as `*…*`
    // on its own line) is the capture note, not verse — tag it so the
    // triptych styles it as metadata. The verse keeps its serif voice;
    // the note reads as mono data beneath a hairline.
    return html.replace(
        /<p><em>([\s\S]*?)<\/em><\/p>(\s*)$/,
        '<p class="stanza-note">$1</p>$2',
    );
}

/**
 * Bespoke triptych renderer (phosphene): image · text · image, with an
 * optional caption beneath. Blocks are grouped greedily — a leading
 * image, the text up to the next image, the closing image, then any
 * text before the following image becomes that triptych's caption. A
 * triptych missing its second image degrades to image + text.
 */
async function renderSeriesTriptychs(blocks: SeriesBlock[]): Promise<string> {
    const metas = new Map<string, BlobMeta | null>();
    await Promise.all(
        blocks
            .filter((b) => b.type === "image")
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
        if (blocks[i].type !== "image") {
            // Stray prose with no image to anchor it — centered stanza.
            out.push(
                `<p class="triptych-loose">${renderStanza(blocks[i].raw)}</p>`,
            );
            i++;
            continue;
        }
        const left = blocks[i++];
        const textParts: SeriesBlock[] = [];
        while (i < blocks.length && blocks[i].type !== "image")
            textParts.push(blocks[i++]);
        const right =
            i < blocks.length && blocks[i].type === "image"
                ? blocks[i++]
                : null;
        const capParts: SeriesBlock[] = [];
        while (i < blocks.length && blocks[i].type !== "image")
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

/**
 * General series renderer: render every block in document order — text
 * as markdown prose (callouts included), images as full-width figures.
 * This is what makes an arbitrary image+text series "all render".
 */
async function renderSeriesFlow(blocks: SeriesBlock[]): Promise<string> {
    const parts = await Promise.all(
        blocks.map(async (b) => {
            if (b.type === "image") {
                const meta = await getBlobMeta(b.cid as string);
                return renderEmbedFigure(b.cid as string, b.alt ?? "", meta);
            }
            const html = marked.parse(b.raw, { async: false }) as string;
            return transformAlerts(html);
        }),
    );
    return parts.join("\n");
}

/**
 * Resolve a `series://<slug>` reference. Dispatch by shape:
 *   - triptych series (phosphene) → bespoke image · text · image layout
 *   - any series with prose       → text + images in document order
 *   - pure-image series           → classic masonry gallery
 * Returns "" if the series is missing or empty.
 */
async function renderSeries(slug: string): Promise<string> {
    const series = await getSeries(slug);
    if (!series?.body) return "";
    const blocks = tokenizeSeries(series.body);
    const images = blocks.filter((b) => b.type === "image");
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

/**
 * Render a markdown body, resolving Farfield's `blob://<cid>` and
 * `series://<slug>` embeds to figure / gallery HTML and rewriting GFM
 * alert blockquotes to semantic callouts.
 *
 * Embeds are pre-replaced with HTML comment placeholders before marked
 * sees the source so its inline parser can't mangle them. After marked
 * emits HTML the placeholders are swapped for the resolved figures
 * (or dropped silently if the underlying record can't be found).
 */
export async function renderMarkdownBody(body: string): Promise<string> {
    interface Embed { alt: string; scheme: "blob" | "series"; id: string }
    const embeds: Embed[] = [];
    const preprocessed = body.replace(
        /!\[([^\]]*)\]\((blob|series):\/\/([a-z0-9-]+)\)/g,
        (_match, alt: string, scheme: string, id: string) => {
            const idx = embeds.length;
            embeds.push({ alt, scheme: scheme as "blob" | "series", id });
            return `\n\n<!--FARFIELD_EMBED:${idx}-->\n\n`;
        },
    );

    // Resolve each embed to its rendered HTML in parallel:
    //   - blob://<cid>    → single <figure> (sized via /blobs/<cid>/meta)
    //   - series://<slug> → masonry gallery (series body → tile grid)
    const rendered = await Promise.all(
        embeds.map(async (e) => {
            if (e.scheme === "series") {
                return renderSeries(e.id);
            }
            const meta = await getBlobMeta(e.id);
            return renderEmbedFigure(e.id, e.alt, meta);
        }),
    );

    let html = marked.parse(preprocessed, { async: false }) as string;

    html = html.replace(
        /<!--FARFIELD_EMBED:(\d+)-->/g,
        (_, idx: string) => rendered[Number(idx)] ?? "",
    );
    html = transformAlerts(html);
    return html;
}

/**
 * RSS/feed-reader variant of `renderMarkdownBody`. Embeds resolve to
 * plain `<img>` tags with absolute wsrv URLs (readers can't run the
 * site's zoom buttons or masonry, and relative/`blob://` URLs render
 * as broken images) — a `blob://<cid>` becomes one image, a
 * `series://<slug>` becomes that series' images in order. 960px keeps
 * reader downloads sane; no width/height attributes since blob meta
 * isn't worth a fetch-per-image on a full-collection feed.
 *
 * `maxImages` caps gallery-heavy items (an art post can carry hundreds
 * of images, which balloons the feed to megabytes); when the cap trims
 * anything and `moreUrl` is set, a "view the full gallery" link to the
 * canonical page closes the item.
 */
export async function renderFeedBody(
    body: string,
    opts: { maxImages?: number; moreUrl?: string } = {},
): Promise<string> {
    const maxImages = opts.maxImages ?? Number.POSITIVE_INFINITY;

    interface Embed { alt: string; scheme: "blob" | "series"; id: string }
    const embeds: Embed[] = [];
    const preprocessed = body.replace(
        /!\[([^\]]*)\]\((blob|series):\/\/([a-z0-9-]+)\)/g,
        (_match, alt: string, scheme: string, id: string) => {
            const idx = embeds.length;
            embeds.push({ alt, scheme: scheme as "blob" | "series", id });
            return `\n\n<!--FARFIELD_EMBED:${idx}-->\n\n`;
        },
    );

    const imgTag = (m: { cid: string; alt: string }) =>
        `<p><img src="${attr(wsrvUrl(blobURL(m.cid), 960))}" alt="${attr(m.alt)}" /></p>`;

    // Resolve every embed to its ordered image list first, then walk
    // the document order with the image budget so truncation always
    // keeps the item's leading images.
    const resolved = await Promise.all(
        embeds.map(async (e): Promise<{ cid: string; alt: string }[]> => {
            if (e.scheme === "blob") return [{ cid: e.id, alt: e.alt }];
            // Series: expand to its images (memoized per-record fetch).
            const series = await getSeries(e.id);
            if (!series?.body) return [];
            return [...series.body.matchAll(
                /!\[([^\]]*)\]\(blob:\/\/([a-z0-9]+)\)/g,
            )].map((m) => ({ cid: m[2], alt: m[1] }));
        }),
    );

    let emitted = 0;
    let omitted = 0;
    const rendered = resolved.map((imgs) => {
        const take = imgs.slice(0, Math.max(0, maxImages - emitted));
        emitted += take.length;
        omitted += imgs.length - take.length;
        return take.map(imgTag).join("\n");
    });

    let html = marked.parse(preprocessed, { async: false }) as string;
    html = html.replace(
        /<!--FARFIELD_EMBED:(\d+)-->/g,
        (_, idx: string) => rendered[Number(idx)] ?? "",
    );
    html = transformAlerts(html);
    if (omitted > 0 && opts.moreUrl) {
        html += `<p><a href="${attr(opts.moreUrl)}">View the full gallery (${omitted} more photo${omitted === 1 ? "" : "s"}) →</a></p>`;
    }
    return html;
}

/**
 * Word count + reading time. Farfield bodies are raw markdown — strip
 * embed syntax and basic markup to get a clean prose word count. 220
 * wpm is the standard adult reading rate for comfortably-paced screen
 * text. Rounded up; floored at 1.
 */
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

/**
 * Pull `<h2>` / `<h3>` headings out of the rendered body and inject an
 * `id` on each so the TOC can deep-link. Returns the modified HTML +
 * the TOC structure for the sidebar.
 */
export function buildToc(html: string): {
    html: string;
    entries: TocEntry[];
} {
    const entries: TocEntry[] = [];
    // Decode the entities marked emits inside heading HTML so the TOC
    // text reads as plain characters (`&amp;` → `&`, `&quot;` → `"`,
    // etc.). Astro re-escapes the resulting string when interpolated
    // with `{entry.text}`, so without this step we double-encode and
    // the sidebar shows literal `&amp;`.
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
            // Respect any id already on the heading.
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
