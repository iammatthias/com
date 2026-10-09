export function retryDelayMs(attempt: number, retryAfter: string | null, capMs: number): number {
    const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
    const requested = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 200 * 3 ** attempt;
    return Math.min(requested, capMs);
}
