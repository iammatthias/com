// TEMPORARY diagnostic — reports which env source resolves the Farfield
// keys in the deployed Worker, WITHOUT leaking values (only presence +
// length). Remove once the prod secret-resolution issue is settled.
export const prerender = false;

import { getSecret } from "astro:env/server";

const KEYS = ["CONTENT_READ_KEY", "FEED_READ_KEY", "CONTENT_API_KEY"];

function describe(v: unknown): string {
    return typeof v === "string" && v ? `set(len=${v.length})` : "undefined";
}

export async function GET() {
    const report: Record<string, { getSecret: string; processEnv: string }> = {};
    for (const k of KEYS) {
        let viaGetSecret = "n/a";
        try {
            viaGetSecret = describe(getSecret(k));
        } catch (e) {
            viaGetSecret = `threw:${e instanceof Error ? e.message : String(e)}`;
        }
        let viaProcess = "n/a";
        try {
            viaProcess = describe(
                (globalThis as { process?: { env?: Record<string, unknown> } })
                    .process?.env?.[k],
            );
        } catch (e) {
            viaProcess = `threw:${e instanceof Error ? e.message : String(e)}`;
        }
        report[k] = { getSecret: viaGetSecret, processEnv: viaProcess };
    }
    return new Response(JSON.stringify(report, null, 2), {
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-robots-tag": "noindex",
        },
    });
}
