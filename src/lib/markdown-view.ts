
import { blobURL, fullEmbedRe, getSeries } from "./farfield";
import type {
    DocumentData,
    FeedEntryData,
    PublicationData,
} from "./farfield-loader";
import { plainText } from "./markdown-text";
import { componentsToMarkdown } from "./doc-components/transform";

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

export async function resolveEmbedsForMarkdown(
    body: string,
): Promise<string> {
    const withPublicRefs = componentsToMarkdown(body).replace(
        /blob:\/\/([a-z0-9-]+)/g,
        (_m, cid: string) => blobURL(cid),
    );
    return replaceAsync(withPublicRefs, fullEmbedRe(), async (m) => {
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

function yamlString(s: string): string {
    return JSON.stringify(s);
}

export function composeDocumentMarkdown(
    doc: DocumentData,
    bodyMd: string,
    origin: string,
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
