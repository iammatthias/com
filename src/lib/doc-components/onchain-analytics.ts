import { escapeAttr } from "../format";
import type { DocComponent } from "./types";

export const ONCHAIN_ANALYTICS_EMBED = "/embeds/ff-onchain-analytics.js";

const CONTRACT_URL =
    "https://sepolia.basescan.org/address/0x29867a886F96e84196fa47DEe2Fb4a5853412C03#code";
const LINK_TEXT = "Read the onchain analytics contract on Basescan";

export const onchainAnalytics: DocComponent = {
    name: "ff-onchain-analytics",

    render(props): string {
        const src = props.src ? ` src="${escapeAttr(props.src)}"` : "";
        return (
            `<ff-onchain-analytics class="ff-onchain-analytics"${src}>` +
            `<p class="ff-onchain-analytics-fallback"><a href="${CONTRACT_URL}" rel="noopener">${LINK_TEXT}</a></p>` +
            `</ff-onchain-analytics>`
        );
    },

    feed(): string {
        return `<p><a href="${CONTRACT_URL}">${LINK_TEXT}</a></p>`;
    },

    markdown(): string {
        return `[${LINK_TEXT}](${CONTRACT_URL})`;
    },

    text(): string {
        return "[live onchain analytics]";
    },
};
