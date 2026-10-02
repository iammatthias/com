import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
    NOTHING_ADDRESS,
    NOTHING_CHAIN_ID,
    PRICE_USD,
    PRICE_USDC,
    decodeContractUri,
    decodeSvg,
    formatEth,
    formatUsd,
} from "./nothing-contract";

const CONTRACT_URI = readFileSync(
    new URL("./__fixtures__/nothing-contract-uri.txt", import.meta.url),
    "utf8",
).trim();

describe("decodeContractUri against the deployed CONTRACT_URI", () => {
    const meta = decodeContractUri(CONTRACT_URI);

    test("reads the collection name", () => {
        expect(meta.name).toBe("Nothing");
    });

    test("carries the inline svg rather than a hosted image", () => {
        expect(meta.image.startsWith("data:image/svg+xml;base64,")).toBe(true);
        expect(meta.image).not.toContain("http");
    });

    test("the description states the terms the contract enforces", () => {
        expect(meta.description).toContain("600 x 600");
        expect(meta.description).toContain("100,000,000 USDC");
        expect(meta.description).toContain("Chainlink");
    });

    test("rejects metadata whose image is not an inline svg", () => {
        const hosted = `data:application/json;base64,${btoa(
            JSON.stringify({ name: "x", description: "y", image: "https://example.com/a.png" }),
        )}`;
        expect(() => decodeContractUri(hosted)).toThrow("not an inline svg");
    });

    test("rejects anything that is not a base64 data uri", () => {
        expect(() => decodeContractUri("https://example.com/meta.json")).toThrow(
            "not a base64 data uri",
        );
    });
});

describe("decodeSvg", () => {
    const svg = decodeSvg(decodeContractUri(CONTRACT_URI).image);

    test("is a 600x600 svg", () => {
        expect(svg).toContain('width="600"');
        expect(svg).toContain('height="600"');
        expect(svg).toContain('viewBox="0 0 600 600"');
    });

    test("is transparent — the artwork is that there is nothing to see", () => {
        expect(svg).toContain('fill="transparent"');
        expect(svg).not.toMatch(/fill="#|fill="rgb|fill="oklch/);
    });

    test("its only mark is a single full-bleed rect", () => {
        expect(svg.match(/<rect/g) ?? []).toHaveLength(1);
        expect(svg).not.toContain("<path");
        expect(svg).not.toContain("<image");
    });
});

describe("constants match the verified source", () => {
    test("price is one hundred million dollars", () => {
        expect(PRICE_USD).toBe(100_000_000);
    });

    test("the USDC amount carries six decimals", () => {
        expect(PRICE_USDC).toBe(BigInt(PRICE_USD) * 1_000_000n);
        expect(PRICE_USDC).toBe(100_000_000_000_000n);
    });

    test("it is an Ethereum mainnet address, checksummed", () => {
        expect(NOTHING_CHAIN_ID).toBe(1);
        expect(NOTHING_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(NOTHING_ADDRESS).not.toBe(NOTHING_ADDRESS.toLowerCase());
    });
});

describe("formatting", () => {
    test("formatEth renders the live price reading legibly", () => {
        expect(formatEth(37_007_247_573_379_265_742_161n)).toBe("37,007.24");
    });

    test("formatEth handles whole and sub-unit amounts", () => {
        expect(formatEth(10n ** 18n)).toBe("1.00");
        expect(formatEth(0n)).toBe("0.00");
        expect(formatEth(1_500_000_000_000_000_000n)).toBe("1.50");
    });

    test("formatUsd renders the headline price", () => {
        expect(formatUsd(PRICE_USD)).toBe("$100,000,000");
    });
});

describe("the ff-nothing component's four forms", async () => {
    const { nothing } = await import("./doc-components/nothing");
    const html = await nothing.render({}, "", async (s) => s);

    test("the rendered host starts disabled and declares a loading state", () => {
        expect(html).toContain('data-state="loading"');
        expect(html.match(/<button[^>]*disabled/g) ?? []).toHaveLength(2);
    });

    test("it offers both payment routes", () => {
        expect(html).toContain('data-nothing-mint="eth"');
        expect(html).toContain('data-nothing-mint="usdc"');
    });

    test("no-JS readers still get a working link", () => {
        expect(html).toContain(`https://etherscan.io/address/${NOTHING_ADDRESS}`);
    });

    test("the markdown twin says something true without any script", () => {
        const md = nothing.markdown!({}, "", (s) => s);
        expect(md).toContain("$100,000,000");
        expect(md).toContain(NOTHING_ADDRESS);
        expect(md).not.toContain("<");
    });

    test("the text form is a short bracketed stand-in", () => {
        const txt = nothing.text!({}, "", (s) => s);
        expect(txt.startsWith("[")).toBe(true);
        expect(txt).toContain("NOTHING");
    });

    test("the feed form is a plain link, no custom elements", () => {
        const feed = nothing.feed!({}, "", async (s) => s) as string;
        expect(feed).not.toContain("ff-nothing");
        expect(feed).toContain("etherscan.io");
    });
});
