"use client";

import { WagmiConfig, createClient } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID;

const client = createClient(
  getDefaultClient({
    appName: "Your App Name",
    alchemyId,
  })
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WagmiConfig client={client}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </WagmiConfig>
    </>
  );
}
