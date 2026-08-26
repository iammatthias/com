// Agent-facing markdown views of Farfield content.
//
// Every content URL on the site has a markdown twin at `<path>.md`
// (documents, section indexes, feed entries), plus the site-level
// /llms.txt map and /llms-full.txt corpus. The twins serve the
// *source* markdown — the same bodies the HTML renderer consumes —
// with the private embed schemes resolved to URLs any reader can
// follow: `blob://<cid>` becomes the public blob URL, and
// `series://<slug>` is spliced open into that series' own markdown.
// Front matter carries the metadata the HTML page renders as chrome
// (title, dates, tags, cid, canonical URL).
//
// The feed-entry twin (the one surface still rendered per request)
// caches body resolution by cid via lib/render-cache (kind
// "feedmdbody"), so the RENDER_VERSION bump ritual there covers
// changes to the markdown shape here too.

import { blobURL, fullEmbedRe, getSeries } from "./farfield";
import type {
    DocumentData,
    FeedEntryData,
    PublicationData,
} from "./farfield-loader";
import { plainText } from "./markdown-text";

/** Regex replace where the replacement is computed asynchronously. */
async function replaceAsync(
    input: string,
    re: RegExp,
    replacer: (match: RegExpMatchArray) => Promise<string>,
): Promise<string> {
    const matches = [...input.matchAll(re)];
    const replacements = await Promise.all(matches.map(replacer));
    let out = "";
    let last = 0;
    matches.forEach((m, i) => {
        out += input.slice(last, m.index) + replacements[i];
        last = (m.index ?? 0) + m[0].length;
    });
    return out + input.slice(last);
}

/**
 * Rewrite a body's embeds for standalone markdown consumption:
 * `blob://<cid>` → the public blob URL, `series://<slug>` → the
 * series' own markdown spliced in place (with its inner blob embeds
 * rewritten the same way — series never nest). A deleted series
 * drops its embed rather than leaking the scheme.
 */
export async function resolveEmbedsForMarkdown(
    body: string,
): Promise<string> {
    return replaceAsync(body, fullEmbedRe(), async (m) => {
        const [, alt, scheme, id] = m;
        if (scheme === "blob") return `![${alt}](${blobURL(id)})`;
        const series = await getSeries(id);
        if (!series?.body) return "";
        return series.body
            .replace(fullEmbedRe(), (_full, iAlt, iScheme, iId) =>
                iScheme === "blob" ? `![${iAlt}](${blobURL(iId)})` : "",
            )
            .trim();
    });
}

/** JSON string — a valid YAML scalar, quoting/escaping included. */
function yamlString(s: string): string {
    return JSON.stringify(s);
}

/**
 * Full markdown twin of a document page. `bodyMd` is the
 * already-resolved body (see resolveEmbedsForMarkdown) so callers can
 * cache that half by cid — the front matter carries timestamps, which
 * the cid does NOT cover, so it must be composed fresh per request.
 */
export function composeDocumentMarkdown(
    doc: DocumentData,
    bodyMd: string,
    origin: string,
    /** Tag-scored neighbours, appended as a Related section so an
     *  agent (or a crawler following .md) can move laterally instead
     *  of returning to the index between every read. */
    related: Array<Pick<DocumentData, "title" | "href" | "description">> = [],
): string {
    const lines = [
        "---",
        `title: ${yamlString(doc.title)}`,
        `section: ${doc.collection}`,
        ...(doc.description
            ? [`description: ${yamlString(doc.description)}`]
            : []),
        ...(doc.tags.length
            ? [`tags: [${doc.tags.map(yamlString).join(", ")}]`]
            : []),
        `created: ${doc.publishedAt}`,
        `updated: ${doc.updatedAt}`,
        `cid: ${doc.cid}`,
        `html: ${origin}${doc.href}`,
        "---",
        "",
        `# ${doc.title}`,
        "",
        bodyMd.trim(),
        "",
    ];
    if (related.length) {
        lines.push(
            "---",
            "",
            "## Related",
            "",
            ...related.map(
                (r) =>
                    `- [${r.title}](${origin}${r.href}.md)${r.description ? `: ${r.description}` : ""}`,
            ),
            "",
        );
    }
    return lines.join("\n");
}

/** Markdown twin of a feed entry page. Same split as documents. */
export function composeFeedEntryMarkdown(
    item: FeedEntryData,
    bodyMd: string,
    origin: string,
): string {
    const lines = [
        "---",
        "section: feed",
        ...(item.tags.length
            ? [`tags: [${item.tags.map(yamlString).join(", ")}]`]
            : []),
        `created: ${item.createdAt}`,
        `updated: ${item.updatedAt}`,
        `cid: ${item.cid}`,
        `html: ${origin}/feed/${item.rkey}`,
        "---",
        "",
        bodyMd.trim(),
        "",
    ];
    return lines.join("\n");
}

/** Markdown index for one publication — the `/<section>.md` twin. */
export function publicationIndexMarkdown(
    pub: PublicationData,
    docs: DocumentData[],
    origin: string,
): string {
    const lines = [`# ${pub.name}`, ""];
    if (pub.description) lines.push(`> ${pub.description}`, "");
    lines.push(
        `${docs.length} ${docs.length === 1 ? "entry" : "entries"}, newest first. ` +
            "Each link is the entry's markdown twin; drop the `.md` suffix for the HTML page.",
        "",
    );
    for (const d of docs) {
        const line = `- ${d.publishedAt.slice(0, 10)} [${d.title}](${origin}${d.href}.md)`;
        lines.push(d.description ? `${line}: ${d.description}` : line);
    }
    lines.push("");
    return lines.join("\n");
}

/** Markdown index for the feed — the `/feed.md` twin. */
export function feedIndexMarkdown(
    items: FeedEntryData[],
    origin: string,
): string {
    const lines = [
        "# Feed",
        "",
        `${items.length} short posts, newest first. Each link is the post's markdown twin; drop the \`.md\` suffix for the HTML page.`,
        "",
    ];
    for (const item of items) {
        // Link label is a text snippet — media-only posts have none.
        // Square brackets would break the link syntax, so drop them.
        const snippet =
            plainText(item.body).slice(0, 100).replace(/[[\]]/g, "").trim() ||
            "(media)";
        lines.push(
            `- ${item.createdAt.slice(0, 10)} [${snippet}](${origin}/feed/${item.rkey}.md)`,
        );
    }
    lines.push("");
    return lines.join("\n");
}
