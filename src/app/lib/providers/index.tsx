"use client";

import { WagmiConfig, createClient, configureChains } from "wagmi";
import { mainnet } from "wagmi/chains";

import { ConnectKitProvider } from "connectkit";

import { InjectedConnector } from "@wagmi/core";
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask";
import { CoinbaseWalletConnector } from "@wagmi/core/connectors/coinbaseWallet";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

import { alchemyProvider } from "wagmi/providers/alchemy";

const alchemyId = process.env.ALCHEMY_ID;
const alchemyRpc = process.env.ALCHEMY_RPC;

const { provider, chains } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: alchemyId! })]
);

const client = createClient({
  autoConnect: false,
  connectors: [
    new InjectedConnector(),
    new CoinbaseWalletConnector({
      options: {
        appName: "IAM",
        jsonRpcUrl: alchemyRpc,
      },
    }),
    new MetaMaskConnector({
      chains: [mainnet],
    }),
    new WalletConnectConnector({
      chains: chains,
      options: {
        projectId: "IAM",
        showQrModal: false,
      },
    }),
  ],
  provider,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider
        theme='auto'
        mode='light'
        customTheme={{
          "--ck-font-family":
            "-apple-system-ui-serif, ui-serif, 'Georgia', serif",
        }}>
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
