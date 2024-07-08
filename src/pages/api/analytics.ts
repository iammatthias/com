import type { APIRoute } from "astro";

export const prerender = false;

const SYNDICATE_KEY = import.meta.env.SYNDICATE_KEY;
const SYNDICATE_ID = import.meta.env.SYNDICATE_ID;
const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT;
const CHAIN_ID = 84532;

export const POST: APIRoute = async ({ request }) => {
  // console.log("API route called");

  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Invalid Content-Type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    // console.error("Failed to parse request body:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // console.log("Parsed request body:", body);

  if (!body || !body.functionName || !body.args) {
    // console.log("Invalid request body structure");
    return new Response(
      JSON.stringify({ error: "Invalid request body structure" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { functionName, args } = body;

  // Ensure args is an object
  const requestBody = {
    projectId: SYNDICATE_ID,
    contractAddress: CONTRACT_ADDRESS,
    chainId: CHAIN_ID,
    functionSignature: functionName,
    args: { ...args }, // Spread the args array into an object
  };

  // console.log("Sending request to Syndicate:", requestBody);
  // console.log("Syndicate Key:", SYNDICATE_KEY ? "Present" : "Missing");

  let syndicateResponse;
  try {
    syndicateResponse = await fetch(
      "https://api.syndicate.io/transact/sendTransaction",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SYNDICATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );
  } catch (fetchError) {
    // console.error("Fetch to Syndicate failed:", fetchError);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to Syndicate API",
        details: fetchError.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // console.log("Syndicate Response Status:", syndicateResponse.status);
  const text = await syndicateResponse.text();
  // console.log("Raw Syndicate Response:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    // console.error("Failed to parse Syndicate response:", parseError);
    return new Response(
      JSON.stringify({
        error: "Failed to parse Syndicate response",
        details: text,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!syndicateResponse.ok) {
    // console.log("Syndicate request failed:", data);
    return new Response(
      JSON.stringify({
        error: data.error || "Transaction failed",
        details: data,
      }),
      {
        status: syndicateResponse.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // console.log("Successful response:", data);
  return new Response(
    JSON.stringify({ success: true, transactionId: data.transactionId }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
