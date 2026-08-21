// The licensable catalogue: every art image, its price, and the terms.
// Prerendered so an agent can browse the offer without paying or
// triggering a payment challenge.

export const prerender = true;

import type { APIRoute } from "astro";
import {
    LICENSE_NETWORK,
    LICENSE_PRICE_USDC,
    LICENSE_TERMS,
    licensableWorks,
} from "@lib/licensing";
import { SITE_ORIGIN } from "@lib/agent-surface";

export const GET: APIRoute = async () => {
    const works = [...(await licensableWorks()).values()];
    return new Response(
        JSON.stringify(
            {
                description:
                    "Usage licences for photographic and generative work published on iammatthias.com. The licence is the product: image files are publicly reachable without payment, and what is sold is the right to use them plus a signed, verifiable record of that right.",
                price: {
                    amount: LICENSE_PRICE_USDC,
                    currency: "USDC",
                    network: LICENSE_NETWORK.caip2,
                    networkName: LICENSE_NETWORK.name,
                    testnet: LICENSE_NETWORK.testnet,
                },
                payment: {
                    protocol: "mpp",
                    alsoAccepts: ["x402"],
                    endpoint: `${SITE_ORIGIN}/api/license/{id}`,
                    documentation: `${SITE_ORIGIN}/license`,
                },
                terms: LICENSE_TERMS,
                count: works.length,
                works: works.map((w) => ({
                    ...w,
                    licenseUrl: `${SITE_ORIGIN}/api/license/${w.cid}`,
                })),
            },
            null,
            2,
        ),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
            },
        },
    );
};
