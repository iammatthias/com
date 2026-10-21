export const DOCUMENTS_TAG = "documents";
export const FEED_TAG = "feed-entries";
/** lib/cache.ts SHELL_TAG: every HTML page and its /api/app/ssr twin */
const SHELL_TAG = "shell";

export type ContentEvent = {
    /** "deploy": a new build is live, so every page's HTML (which names the build's files) goes */
    kind: "entry" | "series" | "collection" | "post" | "deploy";
    slug?: string;
};

const KINDS = new Set<ContentEvent["kind"]>(["entry", "series", "collection", "post", "deploy"]);

export function parseContentEvents(body: unknown): ContentEvent[] | null {
    const list = Array.isArray(body) ? body : [body];
    if (list.length === 0 || list.length > 50) return null;
    const events: ContentEvent[] = [];
    for (const item of list) {
        if (typeof item !== "object" || item === null) return null;
        const { kind, slug } = item as Record<string, unknown>;
        if (typeof kind !== "string" || !KINDS.has(kind as ContentEvent["kind"])) return null;
        if (slug !== undefined && typeof slug !== "string") return null;
        events.push({ kind: kind as ContentEvent["kind"], slug });
    }
    return events;
}

export function tagsFor(events: ContentEvent[]): string[] {
    const tags = new Set<string>();
    for (const e of events) tags.add(e.kind === "deploy" ? SHELL_TAG : e.kind === "post" ? FEED_TAG : DOCUMENTS_TAG);
    return [...tags].sort();
}

export function bearerMatches(header: string | null, secret: string | undefined): boolean {
    if (!secret || !header?.startsWith("Bearer ")) return false;
    const given = new TextEncoder().encode(header.slice(7));
    const want = new TextEncoder().encode(secret);
    if (given.length !== want.length) return false;
    let diff = 0;
    for (let i = 0; i < want.length; i++) diff |= given[i] ^ want[i];
    return diff === 0;
}
