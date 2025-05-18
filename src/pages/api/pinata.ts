export const prerender = false;

import type { APIRoute } from "astro";
import { pinata } from "../../lib/pinata";

// Fallback to public gateway if Pinata auth fails
const PUBLIC_GATEWAY = "https://ipfs.io/ipfs/";

export const POST: APIRoute = async ({ request }) => {
  try {
    const requestUrl = new URL(request.url);
    const cid = requestUrl.searchParams.get("cid");

    if (!cid) {
      return new Response(JSON.stringify({ error: "CID parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = await pinata.gateways.private.createAccessLink({
        cid,
        expires: 30,
      });

      return new Response(JSON.stringify({ url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (pinataError) {
      console.error("Pinata API Error:", pinataError);

      // Fallback to public gateway
      const fallbackUrl = `${PUBLIC_GATEWAY}${cid}`;
      console.log("Falling back to public gateway:", fallbackUrl);

      return new Response(
        JSON.stringify({
          url: fallbackUrl,
          warning: "Using public gateway due to Pinata authentication failure",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process image request. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
