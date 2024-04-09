import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { addSessionABI } from "@lib/abi";
import { Mutex } from "async-mutex";

const mutex = new Mutex();
let nonce = null;

export async function POST({ request }) {
  try {
    const requestBody = await request.json();
    const sessionHash = requestBody.sessionHash;
    const contractAddress = import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;
    const privateKey = import.meta.env.HIT_COUNTER_WALLET;

    if (!sessionHash || !contractAddress || !privateKey) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({
          status: "Error",
          message: "Missing required parameters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const account = privateKeyToAccount(`0x${privateKey}`);

    const { request: contractRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addSessionABI,
      functionName: "addSession",
      args: [sessionHash],
      account,
    });

    const release = await mutex.acquire();
    try {
      if (nonce === null) {
        nonce = await publicClient.getTransactionCount({
          address: account.address,
          blockTag: "latest",
        });
      } else {
        nonce++;
      }

      contractRequest.nonce = nonce;
    } finally {
      release();
    }

    const writeContractResponse =
      await walletClient.writeContract(contractRequest);
    console.log("Transaction hash:", writeContractResponse);

    return new Response(JSON.stringify({ status: "OK" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ status: "Error", message: "An error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
