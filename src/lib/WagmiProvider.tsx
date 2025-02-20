import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider as WagmiConfig } from "wagmi";
import { config } from "@/lib/wagmiConfig";
import { type ReactNode } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

export default function WagmiProvider({ children }: Props) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: "var(--blue)",
              accentColorForeground: "white",
              borderRadius: "small",
            }),
            darkMode: darkTheme({
              accentColor: "var(--blue)",
              accentColorForeground: "white",
              borderRadius: "small",
            }),
          }}
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
