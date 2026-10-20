import { ONCHAIN_ANALYTICS_EMBED } from "@lib/doc-components/onchain-analytics";
import { TUNER_EMBED } from "@lib/doc-components/tuner";
import { importWithRetry } from "@lib/import-with-retry";

const LOADERS: Record<string, () => Promise<unknown>> = {
    "ff-tuner": () => importWithRetry(TUNER_EMBED),
    "ff-nothing": () => import("./nothing-client"),
    "ff-onchain-analytics": () => importWithRetry(ONCHAIN_ANALYTICS_EMBED),
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
