export interface BodyEmbed {
    alt: string;
    scheme: "blob" | "series";
    id: string;
}

const FULL_EMBED_RE = /!\[([^\]]*)\]\((blob|series):\/\/([a-z0-9-]+)\)/g;

export const EMBED_PATTERN_SOURCE = FULL_EMBED_RE.source;

export const BLOB_ID_SOURCE = "blob:\\/\\/([a-z0-9-]+)";

export function fullEmbedRe(): RegExp {
    return new RegExp(FULL_EMBED_RE.source, "g");
}

export function extractBodyEmbeds(markdown: string): BodyEmbed[] {
    const out: BodyEmbed[] = [];
    for (const m of markdown.matchAll(FULL_EMBED_RE)) {
        out.push({
            alt: m[1],
            scheme: m[2] as "blob" | "series",
            id: m[3],
        });
    }
    return out;
}
