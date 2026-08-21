// Verify a licence grant without trusting whoever presents it. POST
// the {license, signature} object exactly as issued; any mutation to
// the licence body invalidates the signature.

export const prerender = false;

import type { APIRoute } from "astro";
import { jsonError } from "@lib/agent-http";
import { verifyLicense, type LicenseGrant } from "@lib/licensing";

export const POST: APIRoute = async ({ request }) => {
    const key =
        (import.meta.env?.MPP_SECRET_KEY as string | undefined) ??
        process.env.MPP_SECRET_KEY;
    if (!key) {
        return jsonError(
            503,
            "verification_unavailable",
            "Licence verification is not configured on this deployment.",
            "Email hey@iammatthias.com to verify a licence manually.",
        );
    }

    let body: { license?: LicenseGrant; signature?: string };
    try {
        body = await request.json();
    } catch {
        return jsonError(
            400,
            "invalid_json",
            "Request body is not valid JSON.",
            'POST the licence object as issued: {"license": {...}, "signature": "..."}.',
        );
    }
    if (!body.license || !body.signature) {
        return jsonError(
            400,
            "missing_fields",
            "Both 'license' and 'signature' are required.",
            "Send the full response you received from /api/license/{id}, unmodified.",
        );
    }

    const valid = await verifyLicense(body.license, body.signature, key);
    return new Response(
        JSON.stringify(
            {
                valid,
                ...(valid
                    ? {
                          licenseId: body.license.id,
                          work: body.license.work,
                          licensee: body.license.licensee,
                          issuedAt: body.license.issuedAt,
                          terms: body.license.terms,
                      }
                    : {
                          reason: "Signature does not match the licence body. It was altered, or not issued by this site.",
                      }),
            },
            null,
            2,
        ),
        {
            status: valid ? 200 : 422,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
            },
        },
    );
};
