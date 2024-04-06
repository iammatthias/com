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

  // Always fetch the latest nonce from the blockchain
  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  // Add the nonce to the transaction
  contractRequest.nonce = nonce;

  await walletClient.writeContract(contractRequest);
  return new Response(JSON.stringify({ status: "OK" }), {
    headers: { "Content-Type": "application/json" },
  });
}
