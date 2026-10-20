import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { decodeFunctionResult, parseAbi } from "viem";
import rpc from "./__fixtures__/onchain-analytics-rpc.json";
import {
    artworkSvg,
    decodeBytes32Array,
    decodeTally,
    decodeUint,
    readAnalytics,
    topPages,
} from "../../public/embeds/ff-onchain-analytics.js";

const abi = parseAbi([
    "function getSessionCount() view returns (uint256)",
    "function getAllSessionIds() view returns (bytes32[])",
    "function getAllPageViews() view returns (string[], uint256[], uint64[])",
    "function getAllEvents() view returns (string[], uint256[], uint64[])",
]);

const reply = (id: number) => rpc.find((r) => r.id === id)!.result as `0x${string}`;

function viemTally(functionName: "getAllPageViews" | "getAllEvents", data: `0x${string}`) {
    const [labels, counts, stamps] = decodeFunctionResult({ abi, functionName, data });
    return labels.map((label, i) => ({ label, count: Number(counts[i]), last: Number(stamps[i]) }));
}

describe("ABI decoding of the stopped analytics contract", () => {
    test("session count matches viem", () => {
        const data = reply(1);
        expect(decodeUint(data)).toBe(decodeFunctionResult({ abi, functionName: "getSessionCount", data }));
        expect(decodeUint(data)).toBe(205n);
    });

    test("session ids match viem", () => {
        const data = reply(2);
        expect(decodeBytes32Array(data)).toEqual([
            ...decodeFunctionResult({ abi, functionName: "getAllSessionIds", data }),
        ]);
    });

    test("page views and events match viem", () => {
        expect(decodeTally(reply(3))).toEqual(viemTally("getAllPageViews", reply(3)));
        expect(decodeTally(reply(4))).toEqual(viemTally("getAllEvents", reply(4)));
    });

    test("top pages drop the test pages", () => {
        const tally = [
            { label: "/test", count: 99, last: 0 },
            { label: "/posts/1546329600000-markdown-test", count: 98, last: 0 },
            { label: "/a", count: 3, last: 0 },
            { label: "/b", count: 7, last: 0 },
        ];
        expect(topPages(tally).map((r) => r.label)).toEqual(["/b", "/a"]);
    });

    test("readAnalytics batches one request and decodes it", async () => {
        const calls: string[] = [];
        const data = await readAnalytics({
            fetchImpl: async (_url: string, init: RequestInit) => {
                const sent = JSON.parse(String(init.body));
                calls.push(...sent.map((c: { params: [{ data: string }] }) => c.params[0].data));
                return new Response(
                    JSON.stringify(sent.map((c: { id: number }) => ({ jsonrpc: "2.0", id: c.id, result: reply(c.id + 1) }))),
                );
            },
        });
        expect(calls).toEqual(["0x6e6734bf", "0x1200d5a6", "0x3b325ffd", "0xc27a500d"]);
        expect(data.sessionCount).toBe(205n);
        expect(data.sessionIds).toHaveLength(205);
        expect(data.pages).toHaveLength(5);
        expect(data.events).toHaveLength(3);
    });
});

describe("readAnalytics when the RPC drops requests", () => {
    const answer = async (_url: string, init: RequestInit) => {
        const sent = JSON.parse(String(init.body));
        return new Response(
            JSON.stringify(sent.map((c: { id: number }) => ({ jsonrpc: "2.0", id: c.id, result: reply(c.id + 1) }))),
        );
    };

    test("recovers after two failed requests", async () => {
        let calls = 0;
        const data = await readAnalytics({
            retryDelays: [0, 0],
            fetchImpl: async (url: string, init: RequestInit) => {
                calls++;
                if (calls <= 2) throw new TypeError("connection reset");
                return answer(url, init);
            },
        });
        expect(calls).toBe(3);
        expect(data.sessionCount).toBe(205n);
    });

    test("gives up after three attempts with the last error", async () => {
        let calls = 0;
        const read = readAnalytics({
            retryDelays: [0, 0],
            fetchImpl: async () => {
                calls++;
                return new Response("", { status: 503 });
            },
        });
        await expect(read).rejects.toThrow("RPC answered 503");
        expect(calls).toBe(3);
    });
});

describe("session portraits match what /onchain-analytics/[hash] drew", () => {
    const goldens: Array<[string, number, string]> = [
        [
            "0xebf247b43923c6d36de2e79d0d738bd257e19e93f2f842d2a54bc1a33a100eeb",
            833240,
            "22cc6b2fdad26ad730b053a734e20e7c82082b6674dd6884736af0827c6cf02a",
        ],
        [
            "0x710093cf49126f395b3729d5f7b7f7db57eb7ac48217b160a9c0ccef47c0e122",
            779740,
            "b9ec7ae4a2111009bfaa36cadfa8e2d73d5614d5439970ad28835e847cb5ab40",
        ],
    ];
    for (const [hash, length, sha] of goldens) {
        test(hash.slice(0, 10), () => {
            const svg = artworkSvg(hash);
            expect(svg.length).toBe(length);
            expect(createHash("sha256").update(svg).digest("hex")).toBe(sha);
        });
    }
});
