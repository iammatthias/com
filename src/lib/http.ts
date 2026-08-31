import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "./agent-surface";

export function siteOrigin(site: URL | string | undefined): string {
    return (site?.toString() ?? SITE_ORIGIN).replace(/\/$/, "");
}

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

export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const out = new Array<R>(items.length);
    let next = 0;
    const workerCount = Math.min(limit, items.length);
    await Promise.all(
        Array.from({ length: workerCount }, async () => {
            while (next < items.length) {
                const i = next++;
                out[i] = await fn(items[i], i);
            }
        }),
    );
    return out;
}
