import { runtimeEnv } from "./runtime-env";
import type { PageHead } from "./seo";

/**
 * The social card for a page, drawn by app/card/card.html (the plate's own shaders) and served
 * by the og Worker (../og) at /og/<sig>.jpg. The URL carries what the card shows and a signature
 * over it, so a changed title or description is a new URL (crawlers keep cards by URL) and the
 * og Worker draws only cards this site asked for. Bump CARD_VERSION when the card's look changes.
 */
export const CARD_VERSION = "v2";

export interface CardSpec {
    kind: "home" | "page";
    eyebrow: string;
    title: string;
    description: string;
    seed: number;
}

/** A stable seed per page, so its card keeps its spiral (FNV-1a of the path). */
export function seedFor(path: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < path.length; i++) {
        h ^= path.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The home card: also every page that isn't indexed, so a 404 for any path mints no card of its own. */
export const HOME_CARD: CardSpec = { kind: "home", eyebrow: "", title: "", description: "", seed: 0x5eed1234 };

export function cardSpec(head: PageHead): CardSpec {
    const path = head.path.replace(/\/+$/, "") || "/";
    if (path === "/" || head.noindex) return HOME_CARD;
    // the section (or "tags") the page sits in: its first breadcrumb, when that isn't the page itself
    const first = head.breadcrumbs?.[0];
    const section = first && first.href !== path ? first.label : "";
    return {
        kind: "page",
        eyebrow: clip(section, 40),
        title: clip(head.title ?? "iammatthias", 120),
        description: clip(head.description ?? "", 200),
        seed: seedFor(path),
    };
}

function canonical(spec: CardSpec): string {
    return [CARD_VERSION, spec.kind, spec.eyebrow, spec.title, spec.description, String(spec.seed)].join("\n");
}

async function hmac(key: string, text: string): Promise<string> {
    const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(text)));
    return [...sig.slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** What the card page reads (kind, eyebrow, title, description, seed). */
export function cardQuery(spec: CardSpec): URLSearchParams {
    const q = new URLSearchParams({ kind: spec.kind, seed: String(spec.seed) });
    if (spec.kind === "page") {
        if (spec.eyebrow) q.set("eyebrow", spec.eyebrow);
        q.set("title", spec.title);
        if (spec.description) q.set("description", spec.description);
    }
    return q;
}

export function specFromQuery(q: URLSearchParams): CardSpec {
    const kind = q.get("kind") === "page" ? "page" : "home";
    return {
        kind,
        eyebrow: q.get("eyebrow") ?? "",
        title: q.get("title") ?? "",
        description: q.get("description") ?? "",
        seed: Number(q.get("seed")) >>> 0,
    };
}

export async function signCard(spec: CardSpec, key: string): Promise<string> {
    return hmac(key, canonical(spec));
}

/** Constant-time check that `sig` is this site's signature for `spec`. */
export async function verifyCard(spec: CardSpec, sig: string, key: string): Promise<boolean> {
    const want = await signCard(spec, key);
    if (want.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
    return diff === 0;
}

const CARD_HOSTS: Record<string, string> = { "https://iammatthias.com": "https://og.iammatthias.com" };

/**
 * The card's URL on the og Worker's own host for the live site, or on `origin` elsewhere (so
 * staging cards are staging's). Undefined when no signing key is configured.
 */
export async function cardImageUrl(head: PageHead, origin: string): Promise<string | undefined> {
    const key = runtimeEnv()?.OG_SIGNING_KEY;
    if (typeof key !== "string" || !key) return undefined;
    const spec = cardSpec(head);
    const sig = await signCard(spec, key);
    return `${CARD_HOSTS[origin] ?? origin}/og/${sig}.jpg?${cardQuery(spec)}`;
}

/** Where a page's own social loop is served: its card's sig names it (app/scripts/og-entries.ts). */
export const ENTRY_LOOP_PATH = /^\/og-video\/v1\/([0-9a-f]{24})\.mp4$/;

/**
 * The page's own social loop, its card over the flowing plate, on `origin`: for a page card, so
 * undefined for the home card (the shared loop is its own) and when no signing key is configured.
 */
export async function cardVideoUrl(head: PageHead, origin: string): Promise<string | undefined> {
    const key = runtimeEnv()?.OG_SIGNING_KEY;
    if (typeof key !== "string" || !key) return undefined;
    const spec = cardSpec(head);
    if (spec.kind !== "page") return undefined;
    return `${origin}/og-video/v1/${await signCard(spec, key)}.mp4`;
}
