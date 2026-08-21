// Structured error responses for the public JSON endpoints.
//
// Shape follows RFC 9457 (problem+json) with an added `resolution`
// hint: an agent that gets one of these should be able to fix its own
// request without a human reading an HTML error page.

/**
 * Advisory RFC-style rate-limit headers, plus the API version.
 *
 * The real limit is Cloudflare's edge default rather than a counter we
 * maintain, so these are honest about being a policy statement: they
 * tell an agent what shape to expect and where the policy is written
 * down, without inventing a per-client quota we don't track.
 */
export const API_VERSION = "1";

export function apiHeaders(
    extra: Record<string, string> = {},
): Record<string, string> {
    return {
        "API-Version": API_VERSION,
        "RateLimit-Policy": '"default"; q=1000; w=60',
        "RateLimit": '"default"; r=1000; t=60',
        Link: '</openapi.json>; rel="service-desc", </developers>; rel="service-doc"',
        ...extra,
    };
}

export function jsonError(
    status: number,
    code: string,
    detail: string,
    resolution: string,
): Response {
    return new Response(
        JSON.stringify(
            {
                type: `https://iammatthias.com/developers#${code}`,
                title: code.replace(/_/g, " "),
                status,
                code,
                detail,
                resolution,
                documentation_url: "https://iammatthias.com/developers",
            },
            null,
            2,
        ),
        {
            status,
            headers: {
                "Content-Type": "application/problem+json; charset=utf-8",
                "Cache-Control": "no-store",
                ...apiHeaders(),
            },
        },
    );
}
