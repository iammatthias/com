import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Ensure environment variable is available
const projectId = import.meta.env.PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  console.error("Missing PUBLIC_WALLETCONNECT_PROJECT_ID environment variable");
}

export const config = getDefaultConfig({
  appName: "iammatthias.com",
  projectId: projectId || "development-only-project-id",
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http("https://base-sepolia.drpc.org"),
  },
  ssr: true, // Enable server-side rendering support
});
