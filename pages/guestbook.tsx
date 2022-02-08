// pages/guestbook.tsx

import TheGuestBook from '@/components/joy/gb/theGuestBook'
import H1 from '@/components/primitives/text/H1'
import WagmiProvider from '@/lib/wagmiProvider'

// components

export default function Guestbook() {
  return (
    <WagmiProvider>
      <article>
        <H1>The Guest Book</H1>
        <TheGuestBook />
      </article>
    </WagmiProvider>
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
