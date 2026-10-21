import { describe, expect, test } from "bun:test";
import { nextAttemptMs, retryDelayMs } from "../src/lib/retry";

describe("retryDelayMs", () => {
    test("backs off 200, 600, 1800 ms without a Retry-After", () => {
        expect([0, 1, 2].map((a) => retryDelayMs(a, null, 10_000))).toEqual([200, 600, 1800]);
    });

    test("honours Retry-After seconds, up to the cap", () => {
        expect(retryDelayMs(0, "2", 10_000)).toBe(2000);
        expect(retryDelayMs(0, "60", 5000)).toBe(5000);
    });

    test("an unreadable Retry-After falls back to the backoff", () => {
        expect(retryDelayMs(1, "Wed, 21 Oct 2026 07:28:00 GMT", 10_000)).toBe(600);
    });
});

describe("nextAttemptMs", () => {
    test("a retry gets the full attempt while the budget allows", () => {
        expect(nextAttemptMs(100, 200, 8000, 5000)).toBe(5000);
    });

    test("a late retry gets only what is left of the budget", () => {
        expect(nextAttemptMs(5000, 200, 8000, 5000)).toBe(2800);
    });

    test("no retry once too little of the budget would remain", () => {
        expect(nextAttemptMs(6000, 1800, 8000, 5000)).toBeNull();
        expect(nextAttemptMs(9000, 0, 8000, 5000)).toBeNull();
    });
});
