import { getContentCache } from "./runtime-env";

const RENDER_VERSION = 3;

const RENDER_TTL_SECONDS = 90 * 24 * 60 * 60;

export async function cachedRender(
    kind: string,
    cid: string,
    render: () => Promise<string>,
): Promise<string> {
    const kv = await getContentCache();
    const key = `render:v${RENDER_VERSION}:${kind}:${cid}`;
    if (kv) {
        try {
            const hit = await kv.get(key, "text");
            if (hit !== null) return hit;
        } catch {}
    }
    const rendered = await render();
    if (kv) {
        try {
            await kv.put(key, rendered, { expirationTtl: RENDER_TTL_SECONDS });
        } catch {}
    }
    return rendered;
}
