import { describe, expect, test } from "bun:test";
import { tuner } from "../src/lib/doc-components/tuner";
import { onchainAnalytics } from "../src/lib/doc-components/onchain-analytics";

const KENNETH = { src: "blob://bafkreibb4lkg5zl25empka2gd4to6ercseai2gnppjzkw4owgldi4trz4u", station: "0xf074ed2953f0905497725cc2dabadadc06bf3ffe", "station-id": "1", chain: "base" };

describe("ff-tuner off the canvas", () => {
    test("links the recording and its station, never the live element", () => {
        expect(tuner.render(KENNETH)).toBe(
            '<div class="ff-tuner"><p class="ff-tuner-fallback"><a href="https://blobs.farfield.systems/blobs/bafkreibb4lkg5zl25empka2gd4to6ercseai2gnppjzkw4owgldi4trz4u" rel="noopener">Download the Station 1 recording as JSONL</a>, ' +
                'or read <a href="https://basescan.org/address/0xf074ed2953f0905497725cc2dabadadc06bf3ffe" rel="noopener">the Station on the block explorer</a>.</p></div>',
        );
        expect(tuner.markdown(KENNETH)).toBe(
            "[Station 1 recording, one transmission per line (JSONL)](https://blobs.farfield.systems/blobs/bafkreibb4lkg5zl25empka2gd4to6ercseai2gnppjzkw4owgldi4trz4u) · [the Station on the block explorer](https://basescan.org/address/0xf074ed2953f0905497725cc2dabadadc06bf3ffe)",
        );
        expect(tuner.text(KENNETH)).toBe("[Station 1 recording]");
    });

    test("a post's attributes can't break out of the link", () => {
        const html = tuner.render({ src: 'x" onclick="alert(1)', "station-id": "<b>" });
        expect(html).not.toContain('" onclick=');
        expect(html).not.toContain("<b>");
    });
});


describe("ff-onchain-analytics off the canvas", () => {
    const RECORD = { src: "blob://bafkreiekwdorblbyizygzxsxusogxpe3z7zkgv6tlccwadshmannyntb4q" };
    test("links the contract and its finished record, never the live element", () => {
        const html = onchainAnalytics.render(RECORD);
        expect(html).not.toContain("<ff-onchain-analytics");
        expect(html).toContain('href="https://blobs.farfield.systems/blobs/bafkreiekwdorblbyizygzxsxusogxpe3z7zkgv6tlccwadshmannyntb4q"');
        expect(onchainAnalytics.markdown(RECORD)).toBe(
            "[Read the onchain analytics contract on Basescan](https://sepolia.basescan.org/address/0x29867a886F96e84196fa47DEe2Fb4a5853412C03#code) · [every session, page view and event, one per line (JSONL)](https://blobs.farfield.systems/blobs/bafkreiekwdorblbyizygzxsxusogxpe3z7zkgv6tlccwadshmannyntb4q)",
        );
        expect(onchainAnalytics.text(RECORD)).toBe("[onchain analytics record]");
    });
});

describe("a component's links", () => {
    test("are https or nothing: a post's src never becomes a script link", () => {
        const evil = { src: "javascript:alert(1)", station: "0x1" };
        expect(tuner.render(evil)).not.toContain("javascript:");
        expect(onchainAnalytics.render(evil)).not.toContain("javascript:");
        expect(onchainAnalytics.markdown(evil)).not.toContain("javascript:");
    });
});
