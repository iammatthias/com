// Access to the Worker's runtime bindings from lib code.
//
// Astro v6+/adapter v14 removed `Astro.locals.runtime.env`; the
// supported path is the `cloudflare:workers` module. It has to load
// lazily here: this file is also pulled in by the *node* prerender
// pass (search-vectors → farfield.ts), and node's ESM loader throws on
// the `cloudflare:` scheme even for unused static imports. The
// `@vite-ignore` keeps the specifier out of vite's resolver so workerd
// resolves it natively at runtime; in node the import throws, we cache
// the failure, and every KV-backed path degrades to a plain fetch.

/** Structural subset of KVNamespace — avoids a types dependency. */
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
            envCache = { v: undefined }; // node prerender / scripts
        }
    }
    return envCache.v;
}

/**
 * The CONTENT_CACHE KV namespace — global, durable cache for cid-keyed
 * immutable data (blob /meta JSON, rendered article HTML). Resolves to
 * undefined wherever the binding isn't available, and callers skip the
 * cache layer entirely.
 */
export async function getContentCache(): Promise<KVLite | undefined> {
    const kv = (await workerEnv())?.CONTENT_CACHE as KVLite | undefined;
    return kv && typeof kv.get === "function" ? kv : undefined;
}
