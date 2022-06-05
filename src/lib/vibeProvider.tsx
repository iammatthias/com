// pages/guestbook.tsx

import '@rainbow-me/rainbowkit/styles.css';

import { providers } from 'ethers';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

// components

export default function VibeProvider({ children }: any) {
  const infuraId = process.env.NEXT_PUBLIC_INFURA;
  const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY;

  const { chains } = configureChains([chain.optimism], [publicProvider()]);

  const { connectors } = getDefaultWallets({
    appName: `The Guestbook`,
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: false,
    connectors,
    // provider,
    provider(config) {
      return new providers.AlchemyProvider(config.chainId, alchemyId);
    },
  });

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
    </WagmiConfig>
  );
}
