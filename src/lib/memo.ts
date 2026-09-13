const DEFAULT_TTL_MS = 60_000;

interface Entry<T> {
    data: T;
    expires: number;
}

export interface MemoOptions<T> {
    ttlMs?: number;
    now?: () => number;
    onError?: (error: unknown, stale: T | undefined) => T;
}

const cache = new Map<string, Entry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export function memo<T>(
    key: string,
    load: () => Promise<T>,
    opts: MemoOptions<T> = {},
): Promise<T> {
    const now = (opts.now ?? Date.now)();
    const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
    const hit = cache.get(key) as Entry<T> | undefined;
    if (hit && hit.expires > now) return Promise.resolve(hit.data);
    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;
    const promise = load()
        .then((data) => {
            cache.set(key, { data, expires: now + ttl });
            inFlight.delete(key);
            return data;
        })
        .catch((error) => {
            inFlight.delete(key);
            if (opts.onError) return opts.onError(error, hit?.data);
            throw error;
        });
    inFlight.set(key, promise);
    return promise;
}

export function forgetMemo(key?: string): void {
    if (key === undefined) {
        cache.clear();
        inFlight.clear();
    } else {
        cache.delete(key);
        inFlight.delete(key);
    }
}
