import { AGENT_CRAWLERS } from "./agent-surface";

export type Representation = "markdown" | "html";

export interface SiteProps {
    representation: Representation;
}

export const NEGOTIATED_VARY_HEADER = "X-Negotiated-Vary";

const NEGOTIATED = new Set(["accept", "user-agent"]);

const AGENT_UA = new RegExp(`(${AGENT_CRAWLERS.join("|")})`, "i");

export function prefersMarkdown(accept: string | null): boolean {
    if (!accept || !accept.toLowerCase().includes("markdown")) return false;
    let md = 0;
    let html = 0;
    for (const part of accept.split(",")) {
        const [rawType, ...params] = part.trim().split(";");
        const type = rawType.trim().toLowerCase();
        let q = 1;
        for (const p of params) {
            const [k, v] = p.trim().split("=");
            if (k.trim() === "q") {
                const n = Number(v);
                if (Number.isFinite(n)) q = n;
            }
        }
        if (type === "text/markdown" || type === "text/x-markdown") {
            md = Math.max(md, q);
        } else if (type === "text/html" || type === "application/xhtml+xml") {
            html = Math.max(html, q);
        }
    }
    return md > 0 && md > html;
}

export function representationFor(request: Request): Representation {
    return prefersMarkdown(request.headers.get("accept")) ||
        AGENT_UA.test(request.headers.get("user-agent") ?? "")
        ? "markdown"
        : "html";
}

export function shelveNegotiatedVary(headers: Headers): void {
    const vary = headers.get("Vary");
    if (!vary) return;
    const tokens = vary.split(",").map((t) => t.trim()).filter(Boolean);
    const shelved = tokens.filter((t) => NEGOTIATED.has(t.toLowerCase()));
    if (shelved.length === 0) return;
    const kept = tokens.filter((t) => !NEGOTIATED.has(t.toLowerCase()));
    if (kept.length > 0) headers.set("Vary", kept.join(", "));
    else headers.delete("Vary");
    headers.set(NEGOTIATED_VARY_HEADER, shelved.join(", "));
}

export function restoreNegotiatedVary(headers: Headers): void {
    const shelved = headers.get(NEGOTIATED_VARY_HEADER);
    if (!shelved) return;
    headers.delete(NEGOTIATED_VARY_HEADER);
    const vary = headers.get("Vary");
    headers.set("Vary", vary ? `${vary}, ${shelved}` : shelved);
}
