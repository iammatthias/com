/** @jsx jsx */
import { jsx } from 'theme-ui';

import Layout from '../components/layout';
import GuestbookCta from '../components/guestbookCta';
import GuestbookList from '../components/guestbookList';

// markup
const IndexPage = () => {
  return (
    <Layout>
      <p sx={{ color: 'text' }}>bruh</p>
      <br />
      <GuestbookCta />
      <br />
      <GuestbookList />
    </Layout>
  );
};

export default IndexPage;
