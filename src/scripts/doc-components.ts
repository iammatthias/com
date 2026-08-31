const LOADERS: Record<string, () => Promise<unknown>> = {
    "ff-compare": () => import("./doc-components/compare"),
};

export function mountDocComponents(root: ParentNode = document): void {
    for (const [tag, load] of Object.entries(LOADERS)) {
        if (!root.querySelector(tag)) continue;
        load().catch((err) => {
            console.error(`[doc-components] <${tag}> failed to load:`, err);
        });
    }
}
