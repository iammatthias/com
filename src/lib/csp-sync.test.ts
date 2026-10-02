import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf8");
const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");

function fromHeaders(): Map<string, Set<string>> {
    const line = headers
        .split("\n")
        .find((l) => l.trim().startsWith("Content-Security-Policy:"));
    if (!line) throw new Error("no CSP in public/_headers");
    return parse(line.slice(line.indexOf(":") + 1));
}

function fromMiddleware(): Map<string, Set<string>> {
    const block = middleware.match(/const CSP = \[([\s\S]*?)\]/);
    if (!block) throw new Error("no CSP array in middleware.ts");
    const parts = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    return parse(parts.join("; "));
}

function parse(csp: string): Map<string, Set<string>> {
    const out = new Map<string, Set<string>>();
    for (const directive of csp.split(";")) {
        const tokens = directive.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) continue;
        out.set(tokens[0], new Set(tokens.slice(1)));
    }
    return out;
}

describe("the two Content-Security-Policy copies stay in sync", () => {
    const a = fromHeaders();
    const b = fromMiddleware();

    test("both define the same directives", () => {
        expect([...a.keys()].sort()).toEqual([...b.keys()].sort());
    });

    test("every directive allows exactly the same sources", () => {
        const drift: string[] = [];
        for (const [name, sources] of a) {
            const other = b.get(name) ?? new Set<string>();
            for (const s of sources) if (!other.has(s)) drift.push(`${name}: ${s} only in _headers`);
            for (const s of other) if (!sources.has(s)) drift.push(`${name}: ${s} only in middleware`);
        }
        expect(drift).toEqual([]);
    });

    test("connect-src covers every origin the client actually calls", () => {
        const connect = a.get("connect-src")!;
        for (const origin of [
            "https://ethereum-rpc.publicnode.com",
            "https://cloudflare-eth.com",
            "https://conet.fm",
        ]) {
            expect(connect.has(origin)).toBe(true);
        }
    });

    test("the policy is not loosened to a wildcard", () => {
        for (const [name, sources] of a) {
            expect(`${name}:${[...sources].join(" ")}`).not.toContain("*");
        }
    });
});
