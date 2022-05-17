// pages/guestbook.tsx

import VibeProvider from '@/lib/vibeProvider';

import { GuestbookText } from '@/components/joy/guestbook/guestbookText';
import Base from '@/components/joy/guestbook/base';

// components

export default function Guestbook() {
  return (
    <VibeProvider>
      <article>
        <GuestbookText css={{ lineHeight: 1, marginBottom: `64px` }}>
          ▀█▀ █░█ █▀▀
          <br />
          ░█░ █▀█ ██▄
          <br />
          <br />
          <GuestbookText
            as="span"
            css={{ display: `inline-block`, marginRight: `16px` }}
          >
            █▀▀ █░█ █▀▀ █▀ ▀█▀
            <br />
            █▄█ █▄█ ██▄ ▄█ ░█░
          </GuestbookText>
          <GuestbookText as="span" css={{ display: `inline-block` }}>
            █▄▄ █▀█ █▀█ █▄▀
            <br />
            █▄█ █▄█ █▄█ █░█
          </GuestbookText>
        </GuestbookText>

        <Base />
      </article>
    </VibeProvider>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `Guestbook`,
    },
  };
};
