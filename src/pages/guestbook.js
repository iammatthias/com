/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import Layout from '../components/layout';
import GuestbookCta from '../components/guestbookCta';
import GuestbookList from '../components/guestbookList';
import Link from '../components/link';
import ClientOnly from '../components/clientOnly';

// markup
const IndexPage = () => {
  return (
    <Layout>
      <article sx={{ p: ['.5rem', '2rem'] }}>
        <ClientOnly>
          <GuestbookCta />
        </ClientOnly>
        <br />
        <br />
        <p>
          Connect and sign the Web3 Guestbook with a gasless meta-transaction
          using your favorite wallet.
        </p>
        <p>
          <small>
            You can view the source for this page{' '}
            <Link href="https://github.com/iammatthias/.com/blob/master/src/pages/guestbook.js">
              here
            </Link>
            ,{' '}
            <Link href="https://github.com/iammatthias/.com/blob/master/src/components/guestbookList.js">
              here
            </Link>
            ,{' '}
            <Link href="https://github.com/iammatthias/.com/blob/master/src/components/guestbookCta.js">
              here
            </Link>
            , and{' '}
            <Link href="https://github.com/iammatthias/.com/blob/guestbook/src/hooks/guestbook-auth.js">
              here
            </Link>
            . This Web3 guestbook is built using{' '}
            <Link href="https://moralis.io">Moralis</Link>, and web3
            authentication is handled using{' '}
            <Link href="https://walletconnect.org">WalletConnect</Link>.
          </small>
        </p>
        <br />
        <GuestbookList />
      </article>
    </Layout>
  );
};

export default IndexPage;
