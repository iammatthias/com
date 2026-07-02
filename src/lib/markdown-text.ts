// Markdown text utilities shared by every surface that needs a
// plain-text or prose-only view of a Farfield body — feed cards, feed
// detail, RSS titles and bodies, reading-time counts. One home for the
// embed-strip regex so the pattern can't drift between hand-rolled
// copies.

import { marked } from "marked";
import { EMBED_PATTERN_SOURCE } from "./farfield";

/** Fresh embed regex per call — the `g` flag makes RegExp stateful. */
function embedRe(): RegExp {
    return new RegExp(`${EMBED_PATTERN_SOURCE}\\s*`, "g");
}

/**
 * Remove `![](blob://…)` / `![](series://…)` embeds from a markdown
 * body, leaving the prose. Surfaces that render media separately (feed
 * cards, feed detail) parse the result so images never double up.
 */
export function stripEmbeds(markdown: string): string {
    return markdown.replace(embedRe(), "");
}

/**
 * Reduce a markdown body to a single line of plain text: embeds
 * dropped, links collapsed to their label, emphasis/heading/quote
 * markers stripped, whitespace normalized. Used for OG descriptions,
 * derived titles, and word counts.
 */
export function plainText(markdown: string): string {
    return stripEmbeds(markdown)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`>#]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Prose-only HTML for a Farfield body: embeds stripped (surfaces that
 * use this render media separately, or — like RSS — skip it), markdown
 * parsed, GFM alerts rewritten to callouts. The shared path behind
 * feed cards, feed detail, and full-content RSS items.
 */
export function proseHtml(markdown: string): string {
    const prose = stripEmbeds(markdown);
    return prose.trim()
        ? transformAlerts(marked.parse(prose, { async: false }) as string)
        : "";
}

/**
 * GFM-style alert blockquotes:
 *   > [!NOTE]
 *   > Body text
 * Marked emits these as plain `<blockquote><p>[!NOTE]\nBody…</p></blockquote>`.
 * Rewrite to a semantic `<aside class="callout callout-note">` with the
 * label split out as its own paragraph for styling (see `.callout` in
 * globals.css). Handles the five canonical types and tolerates either
 * single-line or multi-paragraph bodies inside the quote.
 */
export function transformAlerts(html: string): string {
    return html.replace(
        /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/gi,
        (_match, rawType, firstBody, rest) => {
            const type = rawType.toLowerCase();
            const label = rawType[0] + rawType.slice(1).toLowerCase();
            const first = firstBody.trim()
                ? `<p>${firstBody.trim()}</p>`
                : "";
            return (
                `<aside class="callout callout-${type}" data-callout="${type}">` +
                `<p class="callout-label">${label}</p>${first}${rest}` +
                `</aside>`
            );
        },
    );
}
