// pages/guestbook.tsx

import TheGuestbook from '@/components/joy/guestbook';

// components

export default function Guestbook() {
  return (
    <article>
      <TheGuestbook />
    </article>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `Guestbook`,
    },
  };
};
