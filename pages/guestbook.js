/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'

import { providers } from 'ethers'
import { Provider, chain, defaultChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

import TheGuestBook from '../components/guestbook/theGuestBook'

export default function Guestbook() {
  const etherscan = process.env.NEXT_PUBLIC_ETHERSCAN
  const infuraId = process.env.NEXT_PUBLIC_INFURA

  // Pick chains
  const chains = defaultChains
  const defaultChain = chain.rinkeby

  // Set up connectors
  const connectors = ({ chainId }) => {
    return [
      new InjectedConnector({ chains }),
      new WalletConnectConnector({
        chains,
        options: {
          infuraId,
          qrcode: true,
        },
      }),
    ]
  }

  // Set up providers
  const isChainSupported = chainId => chains.some(x => x.id === chainId)

  const provider = ({ chainId, Connector }) =>
    providers.getDefaultProvider(
      isChainSupported(chainId) ? chainId : defaultChain.id,
      {
        etherscan,
        infuraId,
      },
    )

  const webSocketProvider = ({ chainId }) =>
    isChainSupported(chainId)
      ? new providers.InfuraWebSocketProvider(chainId, infuraId)
      : undefined

  return (
    <Provider
      autoConnect
      connectors={connectors}
      provider={provider}
      webSocketProvider={webSocketProvider}
    >
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
