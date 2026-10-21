import type { DocComponent } from "./types";
import { NOTHING_ADDRESS, PRICE_USD, formatUsd } from "../nothing-contract";

const ETHERSCAN = `https://etherscan.io/address/${NOTHING_ADDRESS}`;
const LINK_TEXT = "NOTHING on Etherscan";

export const nothing: DocComponent = {
    name: "ff-nothing",

    render(): string {
        return (
            `<ff-nothing class="nothing" data-state="loading">` +
            `<figure class="nothing-frame" aria-label="Nothing, a 600 by 600 transparent SVG stored onchain">` +
            `<div class="nothing-canvas" data-nothing-canvas></div>` +
            `</figure>` +
            `<dl class="nothing-facts">` +
            `<div><dt>Price</dt><dd>${formatUsd(PRICE_USD)}</dd></div>` +
            `<div><dt>In ETH</dt><dd data-nothing-eth>—</dd></div>` +
            `<div><dt>Status</dt><dd data-nothing-status>reading the chain…</dd></div>` +
            `</dl>` +
            `<div class="nothing-actions">` +
            `<button type="button" data-nothing-mint="eth" disabled>Mint with ETH</button>` +
            `<button type="button" data-nothing-mint="usdc" disabled>Mint with USDC</button>` +
            `</div>` +
            `<p class="nothing-note" data-nothing-note></p>` +
            `<p class="nothing-fallback"><a href="${ETHERSCAN}" rel="noopener">${LINK_TEXT}</a></p>` +
            `</ff-nothing>`
        );
    },

    feed(): string {
        return `<p><a href="${ETHERSCAN}">${LINK_TEXT}</a></p>`;
    },

    markdown(): string {
        return `A 1/1 transparent SVG stored onchain, priced at ${formatUsd(PRICE_USD)} in USDC or the Chainlink-rate equivalent in ETH. [${LINK_TEXT}](${ETHERSCAN})`;
    },

    text(): string {
        return `[NOTHING — ${formatUsd(PRICE_USD)}, unminted 1/1 at ${NOTHING_ADDRESS}]`;
    },
};
