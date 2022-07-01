// Guestbook
// Language: typescript

// A web3 guestbook.

import Layout from '@/components/Layout';
import Text from '@/components/Text';

// components

export default function Home() {
  return (
    <Layout as="main" layout="pageContent">
      <Text as="h3" kind="h3">
        The Guestbook
      </Text>

      <Text as="p" kind="p">
        what a crock
      </Text>
    </Layout>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `The Guestbook`,
    },
  };
};
