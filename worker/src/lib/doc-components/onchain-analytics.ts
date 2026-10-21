import { escapeAttr } from "../format";
import type { DocComponent } from "./types";

const CONTRACT_URL =
    "https://sepolia.basescan.org/address/0x29867a886F96e84196fa47DEe2Fb4a5853412C03#code";
const LINK_TEXT = "Read the onchain analytics contract on Basescan";
const BLOBS = "https://blobs.farfield.systems/blobs/";

/** The contract's finished record, every log one JSONL line (com's lib/doc-components/onchain-analytics.ts). */
function recordUrl(src: string | undefined): string | null {
    if (!src) return null;
    return src.startsWith("blob://") ? BLOBS + src.slice("blob://".length) : src.startsWith("https://") ? src : "";
}

export const onchainAnalytics: DocComponent = {
    name: "ff-onchain-analytics",

    render(props): string {
        const record = recordUrl(props.src);
        const download = record ? ` · <a href="${escapeAttr(record)}" rel="noopener">Download the record as JSONL</a>` : "";
        // only the links, as for the tuner: the app hosts the live element over its canvas
        return `<div class="ff-onchain-analytics"><p class="ff-onchain-analytics-fallback"><a href="${CONTRACT_URL}" rel="noopener">${LINK_TEXT}</a>${download}</p></div>`;
    },

    feed(props): string {
        const record = recordUrl(props.src);
        const download = record ? ` · <a href="${escapeAttr(record)}">Download the record as JSONL</a>` : "";
        return `<p><a href="${CONTRACT_URL}">${LINK_TEXT}</a>${download}</p>`;
    },

    markdown(props): string {
        const record = recordUrl(props.src);
        const download = record ? ` · [every session, page view and event, one per line (JSONL)](${record})` : "";
        return `[${LINK_TEXT}](${CONTRACT_URL})${download}`;
    },

    text(): string {
        return "[onchain analytics record]";
    },
};
