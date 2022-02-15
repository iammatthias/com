// pages/guestbook.tsx

import { providers } from 'ethers'
import { Provider, chain, defaultChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// components

export default function WagmiProvider({ children }: any) {
  // Pick chains
  const chains = defaultChains
  const defaultChain = chain.rinkeby

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

  const rinkeby = {
    name: 'rinkeby',
    chainId: 4,
    _defaultProvider: (providers: any) =>
      new providers.JsonRpcProvider('https://rinkeby-light.eth.linkpool.io/'),
  }

  const provider = () =>
    providers.getDefaultProvider(rinkeby, {
      etherscan: process.env.NEXT_PUBLIC_ETHERSCAN,
      infura: process.env.NEXT_PUBLIC_INFURA,
      alchemy: process.env.NEXT_PUBLIC_ALCHEMY,
    })

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
