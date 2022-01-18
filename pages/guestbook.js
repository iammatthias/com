/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'

import { providers } from 'ethers'
import { Provider, chain, defaultChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

import App from '../components/guestbook/app'

import Guests from '../components/guestbook/guests'

export default function Guestbook() {
  const chains = defaultChains
  const defaultChain = chain.rinkeby

  const etherscan = process.env.NEXT_PUBLIC_ETHERSCAN
  const infuraId = process.env.NEXT_PUBLIC_INFURA
  // Set up connectors

  const isChainSupported = chainId => chains.some(x => x.id === chainId)

  const provider = ({ chainId }) =>
    providers.getDefaultProvider(
      isChainSupported(chainId) ? chainId : defaultChain.id,
      {
        etherscan,
        infuraId,
      },
    )

  const connectors = () => {
    return [
      new InjectedConnector({ chains }),
      new WalletConnectConnector({
        chains: [chain.mainnet, chain.rinkeby],
        options: {
          infuraId,
          qrcode: true,
        },
      }),
    ]
  }

  return (
    <Provider autoConnect provider={provider} connectors={connectors}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateAreas: [
            '"contract" "guests"',
            '"contract" "guests"',
            '"contract guests"',
          ],
          gridTemplateColumns: ['1fr', '1fr', '1fr 1fr'],
          gridGap: 4,
        }}
      >
        <Box sx={{ gridArea: 'contract' }}>
          <Box
            sx={{
              bg: 'accent',
              p: 3,
              mb: 4,
              borderRadius: 3,
              width: ['100%'],
            }}
          >
            <p sx={{ m: 0 }}>
              Contract is live on Rinkeby. Front end is under development. Feel
              free to explore, but beware, there be dragons.
            </p>
          </Box>
          <p sx={{ m: 0, mb: 4 }}>
            write a message on the blockchain<sup>1</sup> and get an nft
            <sup>2</sup>
          </p>
          <App />
          <p sx={{ m: 0, mb: 4 }}>
            <small>
              <sup>1</sup> contract:{' '}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  '/address/' +
                  process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
                }
              >
                {process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS}
              </a>
              <br />
              <sup>2</sup> [9999] guests available. free to mint, wallet holder
              pays gas. max 3 guests per wallet
              <br />☞ missed the nfts? you can still write your message on the
              blockchain
            </small>
          </p>
        </Box>
        <Guests />
      </Box>
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
