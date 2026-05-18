import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
