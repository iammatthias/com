import { marked } from "marked";
import { EMBED_PATTERN_SOURCE } from "./farfield";
import { extractRecipes, recipeText } from "./recipe";
import { componentsToText } from "./doc-components/transform";

function freshEmbedRe(): RegExp {
    return new RegExp(`${EMBED_PATTERN_SOURCE}\\s*`, "g");
}

export function stripEmbeds(markdown: string): string {
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
        .replace(/[*_`>#]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function proseHtml(markdown: string): string {
    const prose = stripEmbeds(markdown);
    return prose.trim()
        ? transformAlerts(marked.parse(prose, { async: false }) as string)
        : "";
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
