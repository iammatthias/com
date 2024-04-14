// import { publicClient, walletClient } from "@lib/viemClients";
// import { privateKeyToAccount } from "viem/accounts";
// import { addSessionABI } from "@lib/abi";

// export async function POST({ request }) {
//   const requestBody = await request.json();
//   const sessionHash = await requestBody.sessionHash;
//   const contractAddress = import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

//   const account = privateKeyToAccount(
//     `0x${import.meta.env.HIT_COUNTER_WALLET}`,
//   );

//   const { request: contractRequest } = await publicClient.simulateContract({
//     address: `0x${contractAddress}`,
//     abi: addSessionABI!,
//     functionName: "addSession",
//     args: [sessionHash],
//     account,
//   });

//   console.log("simulated session");

//   const response = await walletClient.writeContract(contractRequest);

//   console.log("tx", response);

//   return new Response(JSON.stringify({ status: "OK" }), {
//     headers: { "Content-Type": "application/json" },
//   });
// }

import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { sessionExistsABI, addSessionABI, addPageViewABI } from "@lib/abi";

export async function POST({ request }) {
  const requestBody = await request.json();
  const { sessionHash, path } = requestBody;
  const contractAddress = import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

  const account = privateKeyToAccount(
    `0x${import.meta.env.HIT_COUNTER_WALLET}`,
  );

  // Check if the session exists using the readContract method
  try {
    const sessionExists = await publicClient.readContract({
      address: `0x${contractAddress}`,
      abi: sessionExistsABI,
      functionName: "sessionExists",
      args: [sessionHash],
    });

    if (!sessionExists) {
      // If session does not exist, register it
      const registerSessionResponse = await registerSession(
        sessionHash,
        account,
        contractAddress,
      );
      if (registerSessionResponse.success) {
        return await recordPageView(
          path,
          sessionHash,
          account,
          contractAddress,
        );
      }
      throw new Error("Failed to register session");
    } else {
      // If session exists, directly record the page view
      return await recordPageView(path, sessionHash, account, contractAddress);
    }
  } catch (error) {
    console.error("Error in operation:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.toString() }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function registerSession(sessionHash, account, contractAddress) {
  try {
    const { request: contractRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addSessionABI,
      functionName: "addSession",
      args: [sessionHash],
      account,
    });

    const response = await walletClient.writeContract(contractRequest);
    if (!response) {
      throw new Error("Transaction hash is undefined.");
    }
    await publicClient.waitForTransactionReceipt({
      hash: response,
    });
    return { success: true, receipt: response };
  } catch (error) {
    console.error("Error registering session:", error);
    throw error; // Re-throw the error for higher-level handling
  }
}

async function recordPageView(path, sessionHash, account, contractAddress) {
  try {
    const { request: pageViewRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addPageViewABI,
      functionName: "addPageView",
      args: [path, sessionHash],
      account,
    });

    const response = await walletClient.writeContract(pageViewRequest);
    console.log("Page view recorded:", response);
    return new Response(JSON.stringify({ status: "OK" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error recording page view:", error);
    throw error; // Re-throw the error for higher-level handling
  }
}
