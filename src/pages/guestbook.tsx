// pages/guestbook.tsx

import TheGuestbook from '@/components/joy/guestbook/theGuestbook';
import { Text } from '@/components/primitives/text';

// components

export default function Guestbook() {
  return (
    <article>
      <Text as="h1">The Guest Book</Text>
      <TheGuestbook />
    </article>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: `Guestbook`,
      },
    },
  };
};
