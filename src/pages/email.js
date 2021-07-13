/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import Layout from '../components/layout';
import Seo from '../components/seo';
import EmailCapture from '../components/emailCapture';

// markup
const IndexPage = ({ data }) => {
  return (
    <Layout>
      <Seo />
      <article sx={{ p: ['.5rem', '2rem'] }}>
        <EmailCapture />
      </article>
    </Layout>
  );
};

export default IndexPage;
