"use client";

import { WagmiConfig, createClient, configureChains } from "wagmi";
import { mainnet } from "wagmi/chains";

import { ConnectKitProvider } from "connectkit";

import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

import { alchemyProvider } from "wagmi/providers/alchemy";

const alchemyId = process.env.ALCHEMY_ID;

const { provider, chains } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: alchemyId! })]
);

const client = createClient({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains: chains,
      options: {
        projectId: "IAM",
      },
    }),
  ],
  provider,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>{children}</ConnectKitProvider>
    </WagmiConfig>
  );
}
