/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import Layout from '../components/layout';
import GuestbookCta from '../components/guestbookCta';
import GuestbookList from '../components/guestbookList';
import Link from '../components/link';

// markup
const IndexPage = () => {
  return (
    <Layout>
      <article sx={{ p: ['.5rem', '2rem'] }}>
        <GuestbookCta />
        <br />
        <br />
        <p>
          This web3 guestbook is built using{' '}
          <Link href="https://moralis.io">Moralis</Link>.
        </p>
        <p>
          Connect and sign with your favorite wallet through{' '}
          <Link href="https://walletconnect.org">WalletConnect</Link>.
        </p>
        <p>
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
          .
        </p>
        <br />
        <GuestbookList />
      </article>
    </Layout>
  );
};

export default IndexPage;
