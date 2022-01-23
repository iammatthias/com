/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'

import { providers } from 'ethers'
import { Provider, chain, defaultL2Chains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

import TheGuestBook from '../components/guestbook/theGuestBook'

export default function Guestbook() {
  const alchemy = process.env.NEXT_PUBLIC_ALCHEMY

  // Pick chains
  const chains = defaultL2Chains
  const defaultChain = chain.polygonTestnetMumbai

  // Set up connectors
  const connectors = ({ chainId }) => {
    return [
      new InjectedConnector({ chains }),
      new WalletConnectConnector({
        defaultChain,
        options: {
          alchemy,
          qrcode: true,
        },
      }),
    ]
  }

  // Set up providers
  const network = {
    name: 'maticmum',
    chainId: 80001,
    _defaultProvider: providers =>
      new providers.AlchemyProvider(80001, alchemy),
  }

  const provider = () => providers.getDefaultProvider(network)

  return (
    <Provider autoConnect connectors={connectors} provider={provider}>
      <TheGuestBook />
    </Provider>
  )
}

//////////////// PAGE CONTENT /////////////////////

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: 'Guestbook',
      },
    },
  }
}
