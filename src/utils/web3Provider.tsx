// web3Provider
// Language: typescript

// RainbowKit + WAGMI to enable web3 goodness. Primarily for the guestbook, but tbd.

import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { providers } from 'ethers';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

export default function Web3Provider({ children }: any) {
  const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY;

  const { chains } = configureChains(
    [chain.optimism],
    [alchemyProvider({ apiKey: process.env.ALCHEMY_ID }), publicProvider()],
  );

  const { connectors } = getDefaultWallets({
    appName: `My RainbowKit App`,
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
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
