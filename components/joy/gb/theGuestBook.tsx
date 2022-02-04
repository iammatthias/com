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
      <P>write a message on the blockchain*</P>
      <P>
        <Small>*contract runs on Polygon, nominal gas fee applies ✌️</Small>
      </P>
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
