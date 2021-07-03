/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import Guestlist from '../components/joy/guestlist';

import ClientOnly from '../components/joy/clientOnly';

import GuestbookCta from '../components/joy/guestbookCta';

import Link from '../components/joy/link';

// markup

export default function Guestbook() {
  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <GuestbookCta />
        <br />
        <br />
        <p>
          This web3 guestbook is built using{' '}
          <Link href="https://moralis.io">Moralis</Link>.
        </p>
        <p>WalletConnect coming soon ✌️</p>
        <p>
          You can view the source for this page{' '}
          <Link href="https://github.com/iammatthias/.com/blob/master/src/components/joy/guestlist.js">
            here
          </Link>
          ,{' '}
          <Link href="https://github.com/iammatthias/.com/blob/master/src/components/joy/guestSign.js">
            here
          </Link>
          , and{' '}
          <Link href="https://github.com/iammatthias/.com/blob/guestbook/src/hooks/use-auth.js">
            here
          </Link>
          .
        </p>

        <ClientOnly>
          <Guestlist />
        </ClientOnly>
      </Box>
    </Layout>
  );
}
