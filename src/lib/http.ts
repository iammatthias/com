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
