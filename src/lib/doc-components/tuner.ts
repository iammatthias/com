import { escapeAttr, escapeHtml } from "../format";
import type { ComponentProps, DocComponent } from "./types";

export const TUNER_EMBED = "/embeds/ff-tuner.js";

const BLOBS = "https://blobs.farfield.systems/blobs/";
const EXPLORERS: Record<string, string> = { base: "https://basescan.org" };

function recording(props: ComponentProps) {
    const src = props.src ?? "";
    const station = props.station ?? "";
    const explorer = EXPLORERS[props.chain ?? "base"] ?? EXPLORERS.base;
    return {
        url: src.startsWith("blob://") ? BLOBS + src.slice("blob://".length) : src,
        stationUrl: `${explorer}/address/${station}`,
        label: `Station ${props["station-id"] ?? ""}`.trim(),
    };
}

export const tuner: DocComponent = {
    name: "ff-tuner",

    render(props): string {
        const r = recording(props);
        const attrs = ["src", "station", "station-id", "chain"]
            .filter((name) => props[name])
            .map((name) => ` ${name}="${escapeAttr(props[name])}"`)
            .join("");
        return (
            `<ff-tuner class="ff-tuner"${attrs}>` +
            `<p class="ff-tuner-fallback"><a href="${escapeAttr(r.url)}" rel="noopener">Download the ${escapeHtml(r.label)} recording as JSONL</a>, ` +
            `or read <a href="${escapeAttr(r.stationUrl)}" rel="noopener">the Station on the block explorer</a>.</p>` +
            `</ff-tuner>`
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
