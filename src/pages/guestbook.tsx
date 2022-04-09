// pages/guestbook.tsx

import WagmiProvider from '@/lib/web3Provider';
import TheGuestbook from '@/components/joy/guestbook';

// components

export default function Guestbook() {
  return (
    <WagmiProvider>
      <article>
        <TheGuestbook />
      </article>
    </WagmiProvider>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `Guestbook`,
    },
  };
};
