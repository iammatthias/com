import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { addSessionABI } from "@lib/abi";

export async function POST({ request }) {
  try {
    const requestBody = await request.json();
    const sessionHash = await requestBody.sessionHash;
    const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

    console.log(`Received request to add session with hash: ${sessionHash}`);

    const account = privateKeyToAccount(
      `0x${import.meta.env.HIT_COUNTER_WALLET}`,
    );

    console.log(`Using account: ${account.address}`);

    const { request: contractRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addSessionABI!,
      functionName: "addSession",
      args: [sessionHash],
      account,
    });

    console.log(
      `Simulated contract request: ${JSON.stringify(contractRequest)}`,
    );

    const result = await walletClient.writeContract(contractRequest);

    console.log(`Transaction sent. Transaction hash: ${result}`);

    return new Response(JSON.stringify({ status: "OK" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error adding session: ${error.message}`);
    return new Response(
      JSON.stringify({ status: "Error", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
