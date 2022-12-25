'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { mainnet, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

import { Receiver } from '@relaycc/receiver';

export default function Providers({ children }: { children: React.ReactNode }) {
  const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID as string;

  const { chains, provider } = configureChains(
    [mainnet],
    [alchemyProvider({ apiKey: ALCHEMY_ID }), publicProvider()],
  );

  const { connectors } = getDefaultWallets({
    appName: `I Am Matthias`,
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: false,
    connectors,
    provider,
  });

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: `#1a1a1a`,
          accentColorForeground: `white`,
          borderRadius: `none`,
          fontStack: `system`,
          overlayBlur: `small`,
        })}
      >
        <Receiver config={null}>{children}</Receiver>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
