// Thoughts
// Language: typescript

// Describes what `Thoughts` are, and renders the content.

// helpers
import Link from 'next/link';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Thoughts from '@/components/Thoughts';

// components

export default function Home() {
  return (
    <Layout as="main" layout="pageContent">
      <Text as="h3" kind="h3">
        Thoughts
      </Text>

      <Text as="p" kind="p">
        <Text as="code">Thoughts</Text> are like tweets—digestible bits of short
        form content that do not matter.
      </Text>
      <Text as="p" kind="p">
        Written with markdown, managed with{` `}
        <Link href="https://obsidian.md">Obsidian</Link>, published using
        GitHub.
      </Text>
      <Thoughts />
    </Layout>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `Thoughts`,
    },
  };
};
