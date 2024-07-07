// File: src/pages/api/analytics-transaction.ts
import type { APIRoute } from "astro";

const SYNDICATE_KEY = import.meta.env.SYNDICATE_KEY;
const SYNDICATE_ID = import.meta.env.SYNDICATE_ID;
const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT;
const CHAIN_ID = 84532;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    console.log("Received request body:", body);

    if (!body) {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { functionName, args } = JSON.parse(body);

    // Process the analytics data here
    // For now, we'll just log it
    console.log("Function Name:", functionName);
    console.log("Arguments:", args);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
