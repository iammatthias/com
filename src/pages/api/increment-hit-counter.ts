import { publicClient } from "@lib/viemClients";
import { sessionExistsABI } from "@lib/abi";

export const prerender = false;

export async function POST({ request }) {
  try {
    const requestBody = await request.json();
    const sessionHash = requestBody.sessionHash;
    const path = requestBody.path;

    // Assuming these values come from your environment configuration
    const SYNDICATE_KEY = import.meta.env.SYNDICATE_KEY;
    const SYNDICATE_ID = import.meta.env.SYNDICATE_ID;
    const CONTRACT_ADDRESS = import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;
    const CHAIN_ID = 84532;

    // Check if the session already exists
    const sessionExists = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: sessionExistsABI,
      functionName: "sessionExists",
      args: [sessionHash],
    });

    if (sessionExists) {
      // console.log("Session already exists");
    } else {
      // Send the transaction to add the session
      const response = await fetch(
        "https://api.syndicate.io/transact/sendTransaction",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SYNDICATE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: SYNDICATE_ID,
            contractAddress: CONTRACT_ADDRESS,
            chainId: CHAIN_ID,
            functionSignature: "addSession(bytes32 sessionHash)",
            args: { sessionHash: sessionHash },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to send session transaction:", errorData);
        return new Response(
          JSON.stringify({ status: "ERROR", error: errorData }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const data = await response.json();
      // console.log("Transaction response:", data);
    }

    // Now, record the page view
    const pageViewResponse = await fetch(
      "https://api.syndicate.io/transact/sendTransaction",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SYNDICATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: SYNDICATE_ID,
          contractAddress: CONTRACT_ADDRESS,
          chainId: CHAIN_ID,
          functionSignature: "addPageView(string path, bytes32 sessionHash)",
          args: { path: path, sessionHash: sessionHash },
        }),
      },
    );

    if (!pageViewResponse.ok) {
      const errorData = await pageViewResponse.text();
      console.error("Failed to send page view transaction:", errorData);
      return new Response(
        JSON.stringify({ status: "ERROR", error: errorData }),
        {
          status: pageViewResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const pageViewData = await pageViewResponse.json();
    // console.log("Page view transaction response:", pageViewData);

    return new Response(JSON.stringify({ status: "OK", data: pageViewData }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ status: "ERROR", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
