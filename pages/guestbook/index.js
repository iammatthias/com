/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Sparkle from '../../components/joy/sparkle'

export default function Guestbook() {
  return (
    <Box sx={{ width: ['100%', '70%', '40%'] }}>
      <h1>The Guest Book</h1>
      <p>
        The Guest Book is a community driven web3 project. A user signs their
        message, and can then choose to write their message to the smart
        contract (
        <a
          href={
            process.env.NEXT_PUBLIC_ETHERSCAN_URL +
            '/address/' +
            process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
          }
        >
          {process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS}
        </a>
        ), receiving an NFT in return.
      </p>
      <p>
        The NFT is an ERC-721 token with an embedded token uri containing an
        on-chain svg. Functionally it is a derivative of{' '}
        <a href="https://twitter.com/dhof">@dhof's</a>{' '}
        <a href="https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7">
          LOOT contract
        </a>
        , customized to use{' '}
        <a href="https://github.com/iainnash/gwei-slim-erc721">
          gwei-slim-erc721
        </a>{' '}
        to optimize gas. Unlike LOOT, the primary "random" factor is actually
        the end user minting the token. Each token uses a{' '}
        <code>foreignObject</code> block to allow for up to 590 characters to
        render nicely within the SVG. What will people choose to inscribe?
      </p>
      <p>
        There is a hard cap of 9999 guest spots available. Once all the tokens
        have been minted, it will no longer be possible to leave a message on
        this contract.
      </p>
      <Link href="./guestbook/sign">
        <Button title="Guestbook" sx={{ width: 'fit-content' }}>
          <Sparkle>Sign The Guest Book</Sparkle>
        </Button>
      </Link>
    </Box>
  )
}

//////////////// PAGE CONTENT /////////////////////

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: 'Guestbook - About',
      },
    },
  }
}
