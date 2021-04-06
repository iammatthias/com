/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import Guestlist from '../components/joy/guestlist';

import ClientOnly from '../components/joy/clientOnly';

import GuestSign from '../components/joy/guestSign';

import Link from '../components/joy/link';

// markup

export default function Guestbook() {
  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <GuestSign />
        <br />
        <br />
        <p>
          This web3 guestbook lets you sign the ledger a Web3 enabled browser.
        </p>
        <p>
          It is built using <Link href="https://moralis.io">Moralis</Link>.
          After signing a `logout` event is sent to disconnect. Be secure and
          disconnect from your wallet as well ✌️
        </p>
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
