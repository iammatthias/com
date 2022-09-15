import { WagmiConfig, createClient, chain } from 'wagmi';
import { ConnectKitProvider, getDefaultClient } from 'connectkit';

type Props = {
  children: React.ReactNode;
};

export default function Web3Provider({ children }: Props) {
  const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY;

  const chains = [chain.optimism];

  const client = createClient(
    getDefaultClient({
      autoConnect: false,
      appName: `The Guestbook - iammatthias.com`,
      alchemyId,
      chains,
    }),
  );
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider
        theme="midnight"
        customTheme={{
          '--ck-connectbutton-background': `#000`,
          '--ck-connectbutton-border-radius': `0`,
          '--ck-font-family': `GT-A Mono`,
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
