import type { DocComponent } from "./types";

const CONET_ORIGIN = "https://conet.fm";
const LINK_TEXT = "Open the CONET tuner on conet.fm";

export const tuner: DocComponent = {
    name: "ff-tuner",

    render(): string {
        return (
            `<ff-tuner class="ff-tuner"><conet-tuner>` +
            `<p class="ff-tuner-fallback"><a href="${CONET_ORIGIN}" rel="noopener">${LINK_TEXT}</a></p>` +
            `</conet-tuner></ff-tuner>`
        );
    },

    feed(): string {
        return `<p><a href="${CONET_ORIGIN}">${LINK_TEXT}</a></p>`;
    },

    markdown(): string {
        return `[${LINK_TEXT}](${CONET_ORIGIN})`;
    },

    text(): string {
        return "[live CONET tuner]";
    },
};
