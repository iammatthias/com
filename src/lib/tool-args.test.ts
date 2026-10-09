import { describe, expect, test } from "bun:test";
import { boundedInt, isJsonObject, isJsonRpcNotification } from "./tool-args";

const SEARCH = { min: 1, max: 50, fallback: 10 };

describe("boundedInt", () => {
    test("missing or empty falls back to the default", () => {
        expect(boundedInt(undefined, SEARCH)).toBe(10);
        expect(boundedInt(null, SEARCH)).toBe(10);
        expect(boundedInt("", SEARCH)).toBe(10);
    });

    test("a negative limit cannot reach past the cap via slice(0, -n)", () => {
        expect(boundedInt(-45, SEARCH)).toBe(1);
    });

    test("over the cap is held to the cap", () => {
        expect(boundedInt(500, SEARCH)).toBe(50);
    });

    test("non-numbers fall back instead of yielding an empty result", () => {
        expect(boundedInt("abc", SEARCH)).toBe(10);
        expect(boundedInt(Number.NaN, SEARCH)).toBe(10);
        expect(boundedInt(Infinity, SEARCH)).toBe(10);
    });

    test("numeric strings and fractions are accepted and truncated", () => {
        expect(boundedInt("7", SEARCH)).toBe(7);
        expect(boundedInt(7.9, SEARCH)).toBe(7);
    });
});

describe("JSON-RPC shape", () => {
    test("a message without an id is a notification, whatever its method", () => {
        expect(isJsonRpcNotification({ jsonrpc: "2.0", method: "notifications/cancelled" })).toBe(true);
        expect(isJsonRpcNotification({ jsonrpc: "2.0", method: "notifications/initialized" })).toBe(true);
    });

    test("an id of null is still a request", () => {
        expect(isJsonRpcNotification({ jsonrpc: "2.0", id: null, method: "ping" })).toBe(false);
        expect(isJsonRpcNotification({ jsonrpc: "2.0", id: 0, method: "ping" })).toBe(false);
    });

    test("only plain objects are requests", () => {
        expect(isJsonObject({})).toBe(true);
        expect(isJsonObject(null)).toBe(false);
        expect(isJsonObject([])).toBe(false);
        expect(isJsonObject("ping")).toBe(false);
    });
});
