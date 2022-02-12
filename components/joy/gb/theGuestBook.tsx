// guestbook

import { useAccount } from 'wagmi'

// components
import Connect from '@/components/joy/gb/connect'
import Account from './account'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Guests from './guests'
import WriteMessage from './signMessage'

export default function TheGuestBook() {
  const [{ data: accountData }] = useAccount()
  return (
    <>
      {accountData?.address ? <Account /> : <Connect />}
      <P css={{ margin: '0' }}>
        Write a message on the blockchain. Maybe get it on an NFT.
      </P>
      <Small>
        <ul style={{ marginTop: '0' }}>
          <li>x max supply (tokens)</li>
          <li>unlimited guestbook messages</li>
          <li>nominal gas fee applies to write message on-chain</li>
          <li>nominal gas fee applies to write message & mint nft</li>
          <li>to add punctuation wrap your message in "double quotes"</li>
        </ul>
      </Small>

      {accountData && <WriteMessage />}
      <Guests />
    </>
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
