import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { decodeFunctionResult, parseAbi } from "viem";
import rpc from "./__fixtures__/onchain-analytics-rpc.json";
import { readFileSync } from "node:fs";
import {
    artworkSvg,
    blobUrl,
    monthYear,
    parseRecord,
    readAnalytics,
    summarize,
    tally,
    topPages,
} from "../../public/embeds/ff-onchain-analytics.js";
import { onchainAnalytics } from "./doc-components/onchain-analytics";

const abi = parseAbi([
    "function getSessionCount() view returns (uint256)",
    "function getAllSessionIds() view returns (bytes32[])",
    "function getAllPageViews() view returns (string[], uint256[], uint64[])",
    "function getAllEvents() view returns (string[], uint256[], uint64[])",
]);

const reply = (id: number) => rpc.find((r) => r.id === id)!.result as `0x${string}`;
const record = readFileSync(new URL("./__fixtures__/onchain-analytics.jsonl", import.meta.url), "utf8");
const rows = parseRecord(record);
const CID = "bafkreiekwdorblbyizygzxsxusogxpe3z7zkgv6tlccwadshmannyntb4q";

function contractTally(functionName: "getAllPageViews" | "getAllEvents", data: `0x${string}`) {
    const [labels, counts, firstSeen] = decodeFunctionResult({ abi, functionName, data });
    return labels.map((label, i) => ({ label, count: Number(counts[i]), first: Number(firstSeen[i]) }));
}

describe("the JSONL record agrees with the stopped contract's own tallies", () => {
    test("one session line per session, in the contract's order", () => {
        const ids = decodeFunctionResult({ abi, functionName: "getAllSessionIds", data: reply(2) }).map((id) => id.toLowerCase());
        expect(summarize(rows).sessionIds).toEqual(ids);
        expect(summarize(rows).sessionCount).toBe(Number(decodeFunctionResult({ abi, functionName: "getSessionCount", data: reply(1) })));
    });

    test("every page path, its count and first view match", () => {
        expect(tally(rows, "pageview", "path")).toEqual(contractTally("getAllPageViews", reply(3)));
    });

    test("every event, its count and first sighting match", () => {
        expect(tally(rows, "event", "name")).toEqual(contractTally("getAllEvents", reply(4)));
    });

    test("the record spans July to November 2024", () => {
        expect(summarize(rows).span.map(monthYear)).toEqual(["July 2024", "November 2024"]);
    });

    test("the summary shows the busiest pages without the test pages", () => {
        expect(summarize(rows).pages.map((p) => [p.label, p.count])).toEqual([
            ["/", 769],
            ["/onchain-analytics", 167],
            ["/notes/1720542994688-starting-a-spice-company", 54],
            ["/art", 37],
            ["/posts", 32],
        ]);
        expect(summarize(rows).events.map((e) => [e.label, e.count])).toEqual([
            ["zoomOpen", 14],
            ["zoomClose", 13],
            ["share", 1],
        ]);
    });

    test("top pages drop the test pages", () => {
        const sample = [
            { label: "/test", count: 99, first: 0 },
            { label: "/posts/1546329600000-markdown-test", count: 98, first: 0 },
            { label: "/a", count: 3, first: 0 },
            { label: "/b", count: 7, first: 0 },
        ];
        expect(topPages(sample).map((r) => r.label)).toEqual(["/b", "/a"]);
    });
});

describe("readAnalytics when the record fails to load", () => {
    test("recovers after two failed requests", async () => {
        let calls = 0;
        const data = await readAnalytics({
            src: `blob://${CID}`,
            retryDelays: [0, 0],
            fetchImpl: async (url: string) => {
                calls++;
                expect(url).toBe(`https://blobs.farfield.systems/blobs/${CID}`);
                if (calls <= 2) throw new TypeError("connection reset");
                return new Response(record);
            },
        });
        expect(calls).toBe(3);
        expect(data.sessionCount).toBe(205);
    });

    test("gives up after three attempts with the last error", async () => {
        let calls = 0;
        const read = readAnalytics({
            src: `blob://${CID}`,
            retryDelays: [0, 0],
            fetchImpl: async () => {
                calls++;
                return new Response("", { status: 503 });
            },
        });
        await expect(read).rejects.toThrow("record answered 503");
        expect(calls).toBe(3);
    });

    test("a missing src fails without fetching", async () => {
        let calls = 0;
        await expect(readAnalytics({ src: "", fetchImpl: async () => (calls++, new Response(record)) })).rejects.toThrow("no record src");
        expect(calls).toBe(0);
    });

    test("the markdown twin links the contract and the JSONL record", () => {
        expect(onchainAnalytics.markdown!({ src: `blob://${CID}` }, "", (s) => s)).toBe(
            "[Read the onchain analytics contract on Basescan](https://sepolia.basescan.org/address/0x29867a886F96e84196fa47DEe2Fb4a5853412C03#code)" +
                ` · [every session, page view and event, one per line (JSONL)](https://blobs.farfield.systems/blobs/${CID})`,
        );
    });

    test("blob links resolve to the blobs host", () => {
        expect(blobUrl(`blob://${CID}`)).toBe(`https://blobs.farfield.systems/blobs/${CID}`);
    });

    test("the page element carries an escaped src", () => {
        const html = onchainAnalytics.render({ src: `blob://x" onload="y` }, "", async (s) => s) as string;
        expect(html).toContain(`src="blob://x&quot; onload=&quot;y"`);
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
