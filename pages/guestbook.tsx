// pages/guestbook.tsx

import TheGuestBook from '@/components/joy/gb/theGuestBook'
import WagmiProvider from '@/lib/wagmiProvider'

// components

export default function Guestbook() {
  return (
    <WagmiProvider>
      <article>
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
