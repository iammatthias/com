import { createPublicClient, http } from "viem";

import { baseSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://base-sepolia-rpc.publicnode.com"),
  // transport: http("https://sepolia.base.org"),
});
