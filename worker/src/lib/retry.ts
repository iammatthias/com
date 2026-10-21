export function retryDelayMs(attempt: number, retryAfter: string | null, capMs: number): number {
    const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
    const requested = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 200 * 3 ** attempt;
    return Math.min(requested, capMs);
}

/**
 * How long the next attempt may run, if one fits: a retry waits `delayMs`, then gets what is
 * left of `budgetMs` (at most `attemptMs`); null once less than `minAttemptMs` would remain.
 */
export function nextAttemptMs(
    elapsedMs: number,
    delayMs: number,
    budgetMs: number,
    attemptMs: number,
    minAttemptMs = 1_000,
): number | null {
    const left = budgetMs - elapsedMs - delayMs;
    return left < minAttemptMs ? null : Math.min(left, attemptMs);
}
