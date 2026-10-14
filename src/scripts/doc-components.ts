import { ONCHAIN_ANALYTICS_EMBED } from "@lib/doc-components/onchain-analytics";

const LOADERS: Record<string, () => Promise<unknown>> = {
    "ff-tuner": () => import("../vendor/conet-tuner/embed.js"),
    "ff-nothing": () => import("./nothing-client"),
    "ff-onchain-analytics": () =>
        import(/* @vite-ignore */ new URL(ONCHAIN_ANALYTICS_EMBED, location.origin).href),
    ".series-tile--live": () => import("./live-tiles"),
};

export function mountDocComponents(root: ParentNode = document): void {
    for (const [tag, load] of Object.entries(LOADERS)) {
        if (!root.querySelector(tag)) continue;
        load().catch((err) => {
            console.error(`[doc-components] <${tag}> failed to load:`, err);
        });
    }
}
