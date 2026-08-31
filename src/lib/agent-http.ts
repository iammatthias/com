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

export function markdownResponse(body: string, maxAge = 3600): Response {
    return new Response(body, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": `public, max-age=${maxAge}`,
            Vary: "Accept",
        },
    });
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
