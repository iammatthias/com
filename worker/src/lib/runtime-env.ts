interface KVLite {
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

let current: MaybeEnv;

export function setRuntimeEnv(env: MaybeEnv): void {
    current = env;
}

export function runtimeEnv(): MaybeEnv {
    return current;
}

export async function getContentCache(): Promise<KVLite | undefined> {
    const kv = current?.CONTENT_CACHE as KVLite | undefined;
    return kv && typeof kv.get === "function" ? kv : undefined;
}
