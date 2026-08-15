// Endpoint method helpers.

import type { APIRoute } from "astro";

/**
 * Derive a HEAD handler from a GET handler. Astro 7 endpoints no
 * longer answer HEAD via GET automatically (a HEAD to a GET-only
 * endpoint 404s), but feed readers and crawlers routinely probe feeds
 * and sitemaps with HEAD before fetching. Runs the real GET and strips
 * the body, so status and headers (Content-Type, Cache-Control,
 * Last-Modified) are exactly what the GET would return.
 */
export function headFromGet(get: APIRoute): APIRoute {
    return async (context) => {
        const response = await get(context);
        return new Response(null, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    };
}

/**
 * Map over `items` with at most `limit` calls of `fn` in flight.
 * Endpoints that render many Farfield-backed items (RSS bodies,
 * llms-full.txt) use this instead of a bare Promise.all: an unbounded
 * storm of upstream lookups contends for workerd's ~6 simultaneous
 * connections per host, and under that pressure renders die with
 * "Response closed due to connection limit".
 */
export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const out = new Array<R>(items.length);
    let next = 0;
    await Promise.all(
        Array.from(
            { length: Math.min(limit, items.length) },
            async () => {
                while (next < items.length) {
                    const i = next++;
                    out[i] = await fn(items[i], i);
                }
            },
        ),
    );
    return out;
}
