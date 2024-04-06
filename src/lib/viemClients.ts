import { createPublicClient, createWalletClient, http } from "viem";

import { holesky } from "viem/chains";

export const publicClient = createPublicClient({
  chain: holesky,
  transport: http("https://ethereum-holesky-rpc.publicnode.com"),
});

export const walletClient = createWalletClient({
  chain: holesky,
  transport: http("https://ethereum-holesky-rpc.publicnode.com"),
});
