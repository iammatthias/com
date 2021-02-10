/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import CirclePacking from '../components/joy/generate/circlePacking';

// markup
const Page = () => {
  const wrappedLayout = false;
  return (
    <Layout wrapped={wrappedLayout}>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <CirclePacking />
      </Box>
    </Layout>
  );
};

export default Page;
