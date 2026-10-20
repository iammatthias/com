import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import groups from "./__fixtures__/conet-station-1-groups.json";
import {
    blobUrl,
    fiveFigureGroups,
    parseRecording,
    readRecording,
    summarize,
} from "../../public/embeds/ff-tuner.js";
import { tuner } from "./doc-components/tuner";

const sample = readFileSync(new URL("./__fixtures__/conet-station-1-sample.jsonl", import.meta.url), "utf8");
const CID = "bafkreibb4lkg5zl25empka2gd4to6ercseai2gnppjzkw4owgldi4trz4u";

describe("Station 1 recording", () => {
    test("five-figure groups match what conet.fm's tuner rendered", () => {
        for (const t of parseRecording(sample)) {
            expect(fiveFigureGroups(t.cipher).join(" ")).toBe((groups as Record<string, string>)[t.seq]);
        }
    });

    test("a zero cipher is one group of zeros", () => {
        expect(fiveFigureGroups("0x0000")).toEqual(["00000"]);
    });

    test("lines are read in sequence order and summarised by kind", () => {
        const recording = parseRecording(sample);
        expect(recording.map((t) => t.seq)).toEqual([1, 2, 26, 359, 462]);
        expect(summarize(recording)).toEqual({
            count: 5,
            firstBlock: 50801985,
            lastBlock: recording[4].block,
            kinds: [
                ["note", 3],
                ["bootstrap", 1],
                ["digest", 1],
            ],
        });
    });

    test("blob links resolve to the blobs host", () => {
        expect(blobUrl(`blob://${CID}`)).toBe(`https://blobs.farfield.systems/blobs/${CID}`);
    });

    test("the recording read recovers after two failed requests", async () => {
        let calls = 0;
        const recording = await readRecording({
            src: `blob://${CID}`,
            retryDelays: [0, 0],
            fetchImpl: async (url: string) => {
                calls++;
                expect(url).toBe(`https://blobs.farfield.systems/blobs/${CID}`);
                if (calls <= 2) throw new TypeError("connection reset");
                return new Response(sample);
            },
        });
        expect(calls).toBe(3);
        expect(recording).toHaveLength(5);
    });

    test("the recording read gives up after three attempts", async () => {
        let calls = 0;
        const read = readRecording({
            src: `blob://${CID}`,
            retryDelays: [0, 0],
            fetchImpl: async () => {
                calls++;
                return new Response("", { status: 503 });
            },
        });
        await expect(read).rejects.toThrow("recording answered 503");
        expect(calls).toBe(3);
    });
});

describe("<ff-tuner> document forms", () => {
    const props = {
        src: `blob://${CID}`,
        station: "0xf074ed2953f0905497725cc2dabadadc06bf3ffe",
        "station-id": "1",
        chain: "base",
    };

    test("markdown links the JSONL and the Station", () => {
        expect(tuner.markdown!(props, "", (s) => s)).toBe(
            `[Station 1 recording, one transmission per line (JSONL)](https://blobs.farfield.systems/blobs/${CID}) · ` +
                "[the Station on the block explorer](https://basescan.org/address/0xf074ed2953f0905497725cc2dabadadc06bf3ffe)",
        );
    });

    test("the page element carries its attributes, escaped", () => {
        const html = tuner.render({ ...props, station: `0x" onload="x` }, "", async (s) => s) as string;
        expect(html).toContain(`src="blob://${CID}"`);
        expect(html).toContain(`station="0x&quot; onload=&quot;x"`);
        expect(html).not.toContain(`onload="x"`);
    });
});
