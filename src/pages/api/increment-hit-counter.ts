import { publicClient, walletClient } from "@lib/viemClients";
import { privateKeyToAccount } from "viem/accounts";
import { addSessionABI } from "@lib/abi";

let pendingNonce: number | null = null;
let transactionQueue: Array<() => Promise<void>> = [];
let processingQueue = false;
let account: any = null;

export async function POST({ request }) {
  if (!account) {
    account = privateKeyToAccount(`0x${import.meta.env.HIT_COUNTER_WALLET}`);
  }

  const requestBody = await request.json();
  const sessionHash = requestBody.sessionHash;
  const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

  const transaction = async () => {
    let nonce: number;
    if (pendingNonce === null) {
      nonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: "pending",
      });
      console.log(`Fetched initial nonce: ${nonce}`);
    } else {
      nonce = pendingNonce;
      console.log(`Using pending nonce: ${nonce}`);
    }
    pendingNonce = nonce + 1;

    const { request: contractRequest } = await publicClient.simulateContract({
      address: `0x${contractAddress}`,
      abi: addSessionABI!,
      functionName: "addSession",
      args: [sessionHash],
      account,
      nonce,
    });

    const result = await walletClient.writeContract(contractRequest);
    console.log(`Transaction sent. Hash: ${result}`);
  };

  transactionQueue.push(transaction);

  if (!processingQueue) {
    processQueue();
  }

  return new Response(JSON.stringify({ status: "OK" }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function processQueue() {
  processingQueue = true;

  try {
    while (transactionQueue.length > 0) {
      const transaction = transactionQueue.shift();
      if (transaction) {
        await transaction();
      }
    }
  } catch (error) {
    console.error(`Error processing transaction: ${error.message}`);
  } finally {
    processingQueue = false;
    console.log("Transaction queue processing completed.");
  }
}

export const GET = () => {
  return new Response(
    JSON.stringify({
      message: "👀",
    }),
  );
};
