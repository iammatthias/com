// Paid licence endpoint. MPP (Machine Payments Protocol) over HTTP
// 402, which also serves x402 clients — x402's "exact" charge maps
// onto MPP's charge intent, so one route answers both.
//
// GET without payment  → 402 with an MPP Challenge quoting the price
// GET with a Credential → verify + settle, then issue a signed licence
//
// What is sold is the licence, not the bytes; see lib/licensing.ts for
// why, and /license for the terms a buyer is agreeing to.

export const prerender = false;

import type { APIRoute } from "astro";
import { Mppx } from "mppx/server";
import { assets, charge } from "mppx/evm/server";
import { jsonError } from "@lib/agent-http";
import {
    LICENSE_PRICE_USDC,
    issueLicense,
    licensableWorks,
} from "@lib/licensing";

const RECIPIENT = "0xF3Be4B7Ba12fb5e648939ED656fDBcCf8DF52e17";

/** Public x402 facilitator — verifies and settles the EIP-3009
 *  authorization on Base Sepolia. */
const FACILITATOR = "https://x402.org/facilitator";

function secret(): string | undefined {
    return (
        (import.meta.env?.MPP_SECRET_KEY as string | undefined) ??
        process.env.MPP_SECRET_KEY
    );
}

export const GET: APIRoute = async ({ params, request }) => {
    const key = secret();
    if (!key) {
        return jsonError(
            503,
            "licensing_unavailable",
            "Licensing is not configured on this deployment.",
            "Try again later, or email hey@iammatthias.com to license directly.",
        );
    }

    const cid = params.cid ?? "";
    const works = await licensableWorks();
    const work = works.get(cid);
    if (!work) {
        return jsonError(
            404,
            "not_licensable",
            `No licensable work with id "${cid}".`,
            "Only images in the art section are licensable. List them at /api/license.json.",
        );
    }

    const mppx = Mppx.create({
        methods: [
            charge({
                currency: assets.baseSepolia.USDC,
                recipient: RECIPIENT,
                // Settlement runs through the public x402 facilitator:
                // it verifies the signed EIP-3009 authorization and
                // broadcasts it, so this Worker never holds a key.
                x402: {
                    facilitator: FACILITATOR,
                    // Accept credentials from any spec-compliant x402
                    // client, not only ones implementing mppx's own
                    // route binding — the point is to serve both.
                    routeBinding: "resource",
                },
            }),
        ],
        secretKey: key,
    });

    const paid = await mppx.charge({
        amount: LICENSE_PRICE_USDC,
        description: `Editorial licence for "${work.title}" (${cid.slice(0, 12)}…)`,
    })(request);

    // Unpaid: hand back the challenge describing what to pay.
    if (paid.status === 402) return paid.challenge;

    const licensee =
        (paid as { payer?: string }).payer ??
        request.headers.get("x-payer") ??
        "unknown";
    const reference =
        (paid as { receipt?: { reference?: string } }).receipt?.reference ??
        "settled";

    const grant = await issueLicense(work, licensee, reference, key);

    return paid.withReceipt(
        new Response(JSON.stringify(grant, null, 2), {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
            },
        }),
    );
};
