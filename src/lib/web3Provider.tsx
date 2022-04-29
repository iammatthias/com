// pages/guestbook.tsx

import '@rainbow-me/rainbowkit/styles.css';

import {
  RainbowKitProvider,
  Chain,
  connectorsForWallets,
  wallet,
  WalletList,
} from '@rainbow-me/rainbowkit';
import { Provider, createClient, chain } from 'wagmi';
import { providers } from 'ethers';

// components

export default function Web3Provider({ children }: any) {
  const infuraId = process.env.NEXT_PUBLIC_INFURA;
  const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY;

  // Set up providers
  const ethProviders = {
    name: `rinkeby`,
    chainId: 4,
    _defaultProvider: (providers: any) => (
      new providers.AlchemyProvider(4, alchemyId),
      new providers.InfuraProvider(4, infuraId)
    ),
  };

  const provider = () => providers.getDefaultProvider(ethProviders);

  const chains: Chain[] = [
    // { ...chain.mainnet, name: 'Ethereum' },
    { ...chain.rinkeby, name: `Rinkeby` },
  ];

  const needsInjectedWalletFallback =
    typeof window !== `undefined` &&
    window.ethereum &&
    !window.ethereum.isMetaMask;

  const wallets: WalletList = [
    {
      groupName: `Suggested`,
      wallets: [
        wallet.rainbow({ chains, infuraId }),
        wallet.walletConnect({ chains, infuraId }),
        wallet.metaMask({ chains, infuraId }),
        ...(needsInjectedWalletFallback
          ? [wallet.injected({ chains, infuraId })]
          : []),
      ],
    },
  ];

  const connectors = connectorsForWallets(wallets);

  const client = createClient({
    autoConnect: true,
    connectors: connectors,
    provider,
  });

  return (
    <RainbowKitProvider chains={chains}>
      <Provider client={client}>{children}</Provider>
    </RainbowKitProvider>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: `Guestbook`,
      },
    },
  };
};
