import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { addSessionABI } from "@lib/abi";

let baseNonce = null; // This will store the initial nonce
let transactionQueue: Array<() => Promise<void>> = []; // Initialize an empty array to hold the transaction queue
let processingQueue = false;
let account; // Initialize account variable

export async function POST({ request }) {
  if (!account) {
    // Ensure the private key is only used here for initializing the account
    account = privateKeyToAccount(`0x${import.meta.env.HIT_COUNTER_WALLET}`);
  }

  const requestBody = await request.json();
  const sessionHash = requestBody.sessionHash; // Await is not necessary here
  const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

  if (baseNonce === null) {
    baseNonce = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: "latest", // Adjust based on your requirement (pending/latest)
    });
  }

  transactionQueue.push(async () => {
    // Calculate the current nonce for this transaction
    const currentNonce = baseNonce!++;

    const { request: contractRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addSessionABI!,
      functionName: "addSession",
      args: [sessionHash],
      account,
      nonce: currentNonce, // Use the incremented nonce
    });

    await walletClient.writeContract(contractRequest);
  });

  if (!processingQueue) {
    processQueue();
  }

  return new Response(JSON.stringify({ status: "OK" }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function processQueue() {
  processingQueue = true;
  while (transactionQueue.length > 0) {
    const transaction = transactionQueue.shift();
    if (transaction) {
      await transaction();
    }
  }
  processingQueue = false;
}
