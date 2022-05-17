// pages/guestbook.tsx

import '@rainbow-me/rainbowkit/styles.css';

import {
  apiProvider,
  configureChains,
  RainbowKitProvider,
  getDefaultWallets,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { createClient, chain, WagmiProvider } from 'wagmi';

// components

export default function VibeProvider({ children }: any) {
  const infuraId = process.env.NEXT_PUBLIC_INFURA;
  const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY;

  const { provider, chains } = configureChains(
    [
      // chain.optimism,
      chain.optimismKovan,
    ],
    [
      apiProvider.alchemy(alchemyId),
      apiProvider.infura(infuraId),
      apiProvider.fallback(),
    ],
  );

  const { connectors } = getDefaultWallets({
    appName: `My RainbowKit App`,
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider
        chains={chains}
        theme={lightTheme({ borderRadius: `none` })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
