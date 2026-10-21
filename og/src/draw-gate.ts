export interface GateKV {
    get(key: string, type: "text"): Promise<string | null>;
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** first draws a Browser Run session may start in one hour, across every request */
export const DRAWS_PER_HOUR = 20;
/** longer than a draw takes, including the budget a crawler waited on it */
const DRAWING_TTL_S = 60;

export type Gate = "draw" | "drawing" | "capped";

/**
 * Whether a request for a card not yet kept may launch a browser now: not while one is already
 * drawing this signature, and not past DRAWS_PER_HOUR starts this hour. Both are a KV read then
 * a write, so two requests in the same instant can both pass: a bound on the browsers a burst
 * can open, not a lock.
 */
export async function drawGate(kv: GateKV, sig: string, now: number): Promise<Gate> {
    const marker = `og:drawing:${sig}`;
    if (await kv.get(marker, "text")) return "drawing";
    const hour = `og:draws:${Math.floor(now / 3_600_000)}`;
    const started = Number(await kv.get(hour, "text")) || 0;
    if (started >= DRAWS_PER_HOUR) return "capped";
    await kv.put(marker, "1", { expirationTtl: DRAWING_TTL_S });
    await kv.put(hour, String(started + 1), { expirationTtl: 3600 });
    return "draw";
}
