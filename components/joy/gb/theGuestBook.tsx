// guestbook

import { useAccount } from 'wagmi'

// components
import Connect from '@/components/joy/gb/connect'
import Account from './account'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Guests from './guests'
import WriteMessage from './signMessage'
import MaxTokens from './maxTokens'

export default function TheGuestBook() {
  const [{ data: accountData }] = useAccount()
  const maxTokens = MaxTokens()
  return (
    <>
      {accountData?.address ? <Account /> : <Connect />}
      <P css={{ margin: '0' }}>
        Write a message on the blockchain. Get it on an NFT (if you want).
      </P>
      <Small>
        <ul style={{ marginTop: '0' }}>
          <li>{maxTokens} max supply (tokens)</li>
          <li>unlimited guestbook messages</li>
          <li>user pays gas to write message on-chain</li>
          <li>
            *optional writing a message & minting an nft are 1 transaction
          </li>
          <li>
            to add punctuation wrap your message in &quot;double quotes&quot;
          </li>
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
