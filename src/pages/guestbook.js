/** @jsx jsx */
import { jsx, Box, Button } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import GuestList from '../components/joy/guestlist';

import ClientOnly from '../components/joy/clientOnly';

import Link from '../components/joy/link';

import { useAuth } from '../hooks/use-auth';

// markup

export default function Guestbook() {
  const { login, currentUser } = useAuth();
  const user = currentUser();
  const userAddress = user?.get('ethAddress');

  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        {user ? (
          <>
            ETH Address: {userAddress}
            <br />
            <br />
          </>
        ) : null}
        <Button
          onClick={() => {
            return login().catch((e) => {
              console.error(e);
            });
          }}
        >
          Sign the Guestbook
        </Button>
        <br />
        <br />
        <p>
          This web3 guestbook lets you sign the ledger with MetaMask (more
          wallets may be supported in the future).
        </p>
        <p>
          The guestbook is built using{' '}
          <Link href="https://moralis.io">Moralis</Link>. Immediately after
          signing a `logout` call is set. Be secure, and disconnect from your
          wallet as well ✌️
        </p>
        <p>
          You can view the source{' '}
          <Link href="https://github.com/iammatthias/.com/tree/master">
            here
          </Link>
          ,{' '}
          <Link href="https://github.com/iammatthias/.com/blob/master/src/components/joy/guestlist.js">
            here
          </Link>
          ,{' '}
          <Link href="https://github.com/iammatthias/.com/blob/guestbook/src/hooks/use-auth.js">
            here
          </Link>
          , and{' '}
          <Link href="https://github.com/iammatthias/.com/blob/guestbook/src/hooks/use-moralis.js">
            here
          </Link>
          .
        </p>

        <ClientOnly>
          <GuestList />
        </ClientOnly>
      </Box>
    </Layout>
  );
}
