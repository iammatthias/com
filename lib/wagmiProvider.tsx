// pages/guestbook.tsx

import { providers } from 'ethers'
import { Provider, chain, defaultL2Chains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// components

export default function WagmiProvider({ children }: any) {
  const alchemy = process.env.NEXT_PUBLIC_ALCHEMY

  // Pick chains
  const chains = defaultL2Chains
  const defaultChain = chain.polygonTestnetMumbai

  // Set up connectors
  const connectors = () => {
    return [
      new InjectedConnector({ chains }),
      new WalletConnectConnector({
        chains: [defaultChain],
        options: {
          qrcode: true,
        },
      }),
    ]
  }
  // Set up providers
  const network = {
    name: 'maticmum',
    chainId: 80001,
    _defaultProvider: (providers: any) =>
      new providers.AlchemyProvider(80001, alchemy),
  }

  const provider = () => providers.getDefaultProvider(network)

  return (
    <Provider autoConnect connectors={connectors} provider={provider}>
      {children}
    </Provider>
  )
}

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: 'Guestbook',
      },
    },
  }
}
