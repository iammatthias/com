import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { addSessionABI } from "@lib/abi";

let nonce = null; // Add a nonce variable

export async function POST({ request }) {
  const requestBody = await request.json();

  const sessionHash = await requestBody.sessionHash;

  const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

  const account = privateKeyToAccount(
    `0x${import.meta.env.HIT_COUNTER_WALLET}`,
  );

  const { request: contractRequest } = await publicClient.simulateContract({
    address: `0x${contractAddress}`,
    abi: addSessionABI!,
    functionName: "addSession",
    args: [sessionHash],
    account,
  });

  // If nonce is null, get the current transaction count
  if (nonce === null) {
    nonce = await publicClient.getTransactionCount({
      address: account.address,
    });
  } else {
    nonce++; // Increment the nonce for each subsequent transaction
  }

  // Add the nonce to the transaction
  contractRequest.nonce = nonce;

  await walletClient.writeContract(contractRequest);
  return new Response(JSON.stringify({ status: "OK" }), {
    headers: { "Content-Type": "application/json" },
  });
}
