/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import Link from '../components/joy/link';

// markup
const Page = () => {
  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <h1 sx={{ fontSize: '33vh', m: 0, p: 0, lineHeight: '1' }}>404</h1>
        <h2 sx={{ textTransform: 'uppercase' }}>
          you don't have to go{' '}
          <Link href="https://iammatthias.com" title="homepage">
            home
          </Link>{' '}
          But you can't stay here
        </h2>
      </Box>
    </Layout>
  );
};

export default Page;
