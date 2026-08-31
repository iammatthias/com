export interface KVLite {
    get(key: string, type: "text"): Promise<string | null>;
    getWithMetadata(
        key: string,
        type: "text",
    ): Promise<{ value: string | null; metadata: unknown }>;
    put(
        key: string,
        value: string,
        opts?: { expirationTtl?: number; metadata?: unknown },
    ): Promise<void>;
}

type MaybeEnv = Record<string, unknown> | undefined;

let envCache: { v: MaybeEnv } | undefined;

async function workerEnv(): Promise<MaybeEnv> {
    if (!envCache) {
        try {
            const mod = (await import(
                /* @vite-ignore */ "cloudflare:workers"
            )) as { env?: MaybeEnv };
            envCache = { v: mod.env };
        } catch {
            envCache = { v: undefined };
        }
    }
    return envCache.v;
}

export async function getContentCache(): Promise<KVLite | undefined> {
    const kv = (await workerEnv())?.CONTENT_CACHE as KVLite | undefined;
    return kv && typeof kv.get === "function" ? kv : undefined;
}
