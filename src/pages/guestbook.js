/** @jsx jsx */
import { jsx, Grid, Box } from 'theme-ui';
import React from 'react'; //eslint-disable-line
import { MoralisProvider } from 'react-moralis';
import loadable from '@loadable/component';

import Layout from '../components/layout';
import Seo from '../components/seo';
import Link from '../components/link';

const Guestbook = loadable(() => import('../components/guestbookCta'));
const Guestlist = loadable(() => import('../components/guestbookList'));

// markup
const Guests = () => {
  return (
    <Layout>
      <MoralisProvider appId={process.env.GATSBY_MORALIS_APPLICATION_ID} serverUrl={process.env.GATSBY_MORALIS_SERVER_ID}>
        <Seo />
        <article sx={{ p: ['.5rem', '2rem'] }}>
          <Grid
            sx={{
              gridTemplateRows: 'auto',
              gridTemplateColumns: ['1fr'],
              gridGap: '2rem',
            }}>
            <Box>
              <Guestbook />
              <br />
              <br />
              <p>Connect and sign the Web3 Guestbook with a gasless meta-transaction using your favorite wallet.</p>
              <p>
                <small>
                  You can view the source for this page <Link href='https://github.com/iammatthias/.com/blob/master/src/pages/guestbook.js'>here</Link>, <Link href='https://github.com/iammatthias/.com/blob/master/src/components/guestbookList.js'>here</Link>, <Link href='https://github.com/iammatthias/.com/blob/master/src/components/guestbookCta.js'>here</Link>, and <Link href='https://github.com/iammatthias/.com/blob/guestbook/src/hooks/guestbook-auth.js'>here</Link>. This Web3 guestbook is built using <Link href='https://moralis.io'>Moralis</Link>, and web3 authentication is handled using <Link href='https://walletconnect.org'>WalletConnect</Link>.
                </small>
              </p>
            </Box>
            <Box>
              <Guestlist />
            </Box>
          </Grid>
        </article>
      </MoralisProvider>
    </Layout>
  );
};

export default Guests;
