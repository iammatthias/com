import { marked } from "marked";
import { EMBED_PATTERN_SOURCE, fullEmbedRe } from "./embeds";
import { extractRecipes, recipeText } from "./recipe";
import { componentsToText } from "./doc-components/transform";

function freshEmbedRe(): RegExp {
    return new RegExp(`${EMBED_PATTERN_SOURCE}\\s*`, "g");
}

function stripEmbeds(markdown: string): string {
    return markdown.replace(freshEmbedRe(), "");
}

export function plainText(markdown: string): string {
    const { body, blocks } = extractRecipes(markdown);
    const withRecipeWords = blocks.length
        ? body.replace(/<!--ffrecipe(\d+)-->/g, (_, i: string) =>
              recipeText(blocks[Number(i)] ?? ""),
          )
        : body;
    return stripEmbeds(componentsToText(withRecipeWords))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]+/g, "")
        .replace(/[>#]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function proseHtml(markdown: string, embeds: readonly string[] = []): string {
    let n = 0;
    const withSlots = markdown.replace(fullEmbedRe(), () => `<!--ffembed${n++}-->`);
    const html = transformAlerts(marked.parse(withSlots, { async: false }) as string)
        .replace(/<p>\s*<!--ffembed(\d+)-->\s*<\/p>/g, "<!--ffembed$1-->")
        .replace(/<!--ffembed(\d+)-->/g, (_, i: string) => embeds[Number(i)] ?? "");
    return html.trim();
}

const ALERT_BLOCKQUOTE_RE =
    /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/gi;

export function transformAlerts(html: string): string {
    return html.replace(
        ALERT_BLOCKQUOTE_RE,
        (_match, rawType, firstParagraph, remainingParagraphs) => {
            const type = rawType.toLowerCase();
            const label = rawType[0] + rawType.slice(1).toLowerCase();
            const first = firstParagraph.trim()
                ? `<p>${firstParagraph.trim()}</p>`
                : "";
            return (
                `<aside class="callout callout-${type}" data-callout="${type}">` +
                `<p class="callout-label">${label}</p>${first}${remainingParagraphs}` +
                `</aside>`
            );
        },
    );
}

const NOTE_TITLE_MAX = 60;

export function noteTitle(markdown: string, max = NOTE_TITLE_MAX): string {
    const line =
        stripEmbeds(markdown)
            .split("\n")
            .map((l) => plainText(l))
            .find((l) => l.length > 0) ?? "";
    return line.length > max ? `${line.slice(0, max).trimEnd()}…` : line || "Note";
}
