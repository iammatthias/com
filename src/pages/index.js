/** @jsx jsx */
import { jsx } from 'theme-ui';

import Layout from '../components/layout';
import GuestbookCta from '../components/guestbookCta';

// markup
const IndexPage = () => {
  return (
    <Layout>
      <p sx={{ color: 'text' }}>bruh</p>
      <br />
      <GuestbookCta />
    </Layout>
  );
};

export default IndexPage;
