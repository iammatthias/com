// pages/guestbook.tsx

import { providers } from 'ethers';
import { Provider, defaultChains, chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

// components

export default function WagmiProvider({ children }: any) {
  // Pick chains
  const chains = defaultChains;
  // const defaultChain = chain.rinkeby;
  const defaultChain = chains[2];

  // Set up connectors
  const connectors = () => {
    return [
      new InjectedConnector({
        chains: [defaultChain],
      }),
      new WalletConnectConnector({
        chains: [defaultChain],
        options: {
          infuraId: process.env.NEXT_PUBLIC_INFURA,
          chainId: 4,
          qrcode: true,
        },
      }),
    ];
  };

  // Set up providers
  const ethProviders = {
    name: `rinkeby`,
    chainId: 4,
    _defaultProvider: (providers: any) => (
      // new providers.JsonRpcProvider(
      //   'https://rinkey.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      // ),
      new providers.AlchemyProvider(4, process.env.NEXT_PUBLIC_ALCHEMY),
      new providers.InfuraProvider(4, process.env.NEXT_PUBLIC_INFURA)
    ),
  };

  const provider = () => providers.getDefaultProvider(ethProviders);

  return (
    <Provider autoConnect connectors={connectors} provider={provider}>
      {children}
    </Provider>
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
