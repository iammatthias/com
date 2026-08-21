// Image licensing — the product is the licence, not the file.
//
// The photographs on this site are publicly fetchable: the site
// embeds a Farfield content id in the page, and the blob service
// serves those bytes without credentials. So access is not what is
// being sold, and pretending otherwise would be charging for
// something the buyer already has.
//
// What is sold is the right to use a specific photograph
// commercially, evidenced by a signed grant that names the work, the
// licensee, the terms, and the payment that bought it. That is a real
// product for anyone who needs to be legally clean — an agency, a
// publisher, or an agent acting for either — and it is honest about
// the file being reachable regardless. The terms say so out loud.
//
// The grant is HMAC-signed so any third party can verify it against
// /api/license/verify without trusting the holder.

import { getCollection } from "astro:content";
import type { DocumentData } from "./farfield-loader";
import { extractBodyEmbeds, getSeries } from "./farfield";
import { SITE_ORIGIN } from "./agent-surface";

/** Only the art section is licensable — the deliberate photographic
 *  and generative work, not incidental screenshots in blog posts. */
export const LICENSABLE_SECTION = "art";

export const LICENSE_PRICE_USDC = "5.00";

/** Base Sepolia while the flow is proven end to end. */
export const LICENSE_NETWORK = {
    name: "Base Sepolia",
    caip2: "eip155:84532",
    testnet: true,
} as const;

export const LICENSE_TERMS = {
    version: "1.0",
    url: `${SITE_ORIGIN}/license`,
    type: "editorial-and-personal",
    exclusive: false,
    perpetual: true,
    attributionRequired: true,
    resalePermitted: false,
    aiTrainingPermitted: false,
    sublicensingPermitted: false,
} as const;

export interface LicensableWork {
    cid: string;
    title: string;
    /** Canonical page the work appears on. */
    url: string;
    section: string;
}

/**
 * Every blob referenced by an art entry, including those reached
 * through a series embed. Resolution goes through the cached Farfield
 * layer, so repeat calls are cheap.
 */
export async function licensableWorks(): Promise<Map<string, LicensableWork>> {
    const docs = (await getCollection("docs"))
        .map((e) => e.data as DocumentData)
        .filter(
            (d) => d.collection === LICENSABLE_SECTION && d.published !== false,
        );

    const works = new Map<string, LicensableWork>();
    for (const doc of docs) {
        const meta = {
            title: doc.title,
            url: `${SITE_ORIGIN}${doc.href}`,
            section: doc.collection,
        };
        for (const embed of extractBodyEmbeds(doc.body)) {
            if (embed.scheme === "blob") {
                works.set(embed.id, { cid: embed.id, ...meta });
                continue;
            }
            const series = await getSeries(embed.id);
            if (!series?.body) continue;
            for (const inner of extractBodyEmbeds(series.body)) {
                if (inner.scheme === "blob") {
                    works.set(inner.id, { cid: inner.id, ...meta });
                }
            }
        }
    }
    return works;
}

export interface LicenseGrant {
    id: string;
    version: string;
    work: LicensableWork;
    licensee: string;
    terms: typeof LICENSE_TERMS;
    price: { amount: string; currency: string; network: string };
    payment: { protocol: string; reference: string };
    issuedAt: string;
    /** Stated plainly so a buyer knows what they bought. */
    note: string;
    termsUrl: string;
    verifyUrl: string;
}

/** Stable serialization — signature must not depend on key order. */
function canonical(grant: LicenseGrant): string {
    return JSON.stringify(grant, Object.keys(grant).sort());
}

async function hmac(secret: string, message: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(message),
    );
    return [...new Uint8Array(sig)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function issueLicense(
    work: LicensableWork,
    licensee: string,
    paymentReference: string,
    secret: string,
): Promise<{ license: LicenseGrant; signature: string }> {
    const issuedAt = new Date().toISOString();
    const id = `lic_${(await hmac(secret, `${work.cid}:${licensee}:${paymentReference}`)).slice(0, 24)}`;
    const license: LicenseGrant = {
        id,
        version: LICENSE_TERMS.version,
        work,
        licensee,
        terms: LICENSE_TERMS,
        price: {
            amount: LICENSE_PRICE_USDC,
            currency: "USDC",
            network: LICENSE_NETWORK.caip2,
        },
        payment: { protocol: "mpp", reference: paymentReference },
        issuedAt,
        note: "This grants usage rights, not access. The image file is publicly reachable without this licence; what you are buying is the right to use it under the terms above, and a signed record proving it.",
        termsUrl: LICENSE_TERMS.url,
        verifyUrl: `${SITE_ORIGIN}/api/license/verify`,
    };
    return { license, signature: await hmac(secret, canonical(license)) };
}

/** Constant-time-ish comparison; signatures are short hex strings. */
function equal(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

export async function verifyLicense(
    license: LicenseGrant,
    signature: string,
    secret: string,
): Promise<boolean> {
    return equal(await hmac(secret, canonical(license)), signature);
}
