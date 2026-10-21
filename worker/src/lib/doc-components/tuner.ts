import { escapeAttr, escapeHtml } from "../format";
import type { ComponentProps, DocComponent } from "./types";

const BLOBS = "https://blobs.farfield.systems/blobs/";
const EXPLORERS: Record<string, string> = { base: "https://basescan.org" };

/** A finished CONET station's recording (com's lib/doc-components/tuner.ts). */
function recording(props: ComponentProps) {
    const src = props.src ?? "";
    const explorer = EXPLORERS[props.chain ?? "base"] ?? EXPLORERS.base;
    return {
        url: src.startsWith("blob://") ? BLOBS + src.slice("blob://".length) : src.startsWith("https://") ? src : "",
        stationUrl: `${explorer}/address/${props.station ?? ""}`,
        label: `Station ${props["station-id"] ?? ""}`.trim(),
    };
}

export const tuner: DocComponent = {
    name: "ff-tuner",

    render(props): string {
        const r = recording(props);
        // only the links: the app hosts the tuner over its canvas, and an <ff-tuner> here would
        // come alive under it the moment the app loads the element (see app/src/dom_embed.rs)
        return (
            `<div class="ff-tuner"><p class="ff-tuner-fallback"><a href="${escapeAttr(r.url)}" rel="noopener">Download the ${escapeHtml(r.label)} recording as JSONL</a>, ` +
            `or read <a href="${escapeAttr(r.stationUrl)}" rel="noopener">the Station on the block explorer</a>.</p></div>`
        );
    },

    feed(props): string {
        const r = recording(props);
        return `<p><a href="${escapeAttr(r.url)}">Download the ${escapeHtml(r.label)} recording as JSONL</a></p>`;
    },

    markdown(props): string {
        const r = recording(props);
        return `[${r.label} recording, one transmission per line (JSONL)](${r.url}) · [the Station on the block explorer](${r.stationUrl})`;
    },

    text(props): string {
        return `[${recording(props).label} recording]`;
    },
};
