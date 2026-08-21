// Structured error responses for the public JSON endpoints.
//
// Shape follows RFC 9457 (problem+json) with an added `resolution`
// hint: an agent that gets one of these should be able to fix its own
// request without a human reading an HTML error page.

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
            },
        },
    );
}
