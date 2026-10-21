export interface PurgeResult {
    success: boolean;
    errors?: Array<{ code: number; message: string }>;
}

interface WorkersCache {
    purge(options: { tags: string[] }): Promise<PurgeResult>;
}

async function workersCache(ctx: unknown): Promise<WorkersCache | undefined> {
    const fromCtx = (ctx as { cache?: WorkersCache } | undefined)?.cache;
    if (fromCtx && typeof fromCtx.purge === "function") return fromCtx;
    try {
        const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as {
            cache?: WorkersCache;
        };
        return mod.cache && typeof mod.cache.purge === "function" ? mod.cache : undefined;
    } catch {
        return undefined;
    }
}

export async function purgeTags(tags: string[], ctx?: unknown): Promise<PurgeResult> {
    const cache = await workersCache(ctx);
    if (!cache) {
        return {
            success: false,
            errors: [{ code: 0, message: "Workers cache purge is unavailable in this runtime" }],
        };
    }
    try {
        return await cache.purge({ tags });
    } catch (err) {
        return {
            success: false,
            errors: [{ code: 0, message: err instanceof Error ? err.message : String(err) }],
        };
    }
}
