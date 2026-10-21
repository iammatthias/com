import { describe, expect, test } from "bun:test";
import { afterResponse, bindExecution, runInRequest } from "../src/lib/request-scope";

describe("afterResponse", () => {
    test("hands the work to the bound request's waitUntil", async () => {
        const handed: Promise<unknown>[] = [];
        let done = false;
        await runInRequest(async () => {
            bindExecution({ waitUntil: (p) => handed.push(p) });
            await afterResponse(async () => {
                done = true;
            });
        });
        expect(handed.length).toBe(1);
        await handed[0];
        expect(done).toBe(true);
    });

    test("awaits the work when no request is bound", async () => {
        let done = false;
        await afterResponse(async () => {
            done = true;
        });
        expect(done).toBe(true);
    });

    test("never throws", async () => {
        await afterResponse(() => {
            throw new Error("boom");
        });
        await afterResponse(() => Promise.reject(new Error("boom")));
    });
});
