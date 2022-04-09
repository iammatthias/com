// pages/test.tsx

import Link from '@/components/primitives/link';
import { Button } from '@/components/primitives/button';
import { Text } from '@/components/primitives/text';

// components

export default function Test() {
  return (
    <article>
      <Text as="h1">404</Text>
      <Text as="h3">Ceci n&apos;est pas une webpage</Text>
      <Link href="/">
        <a>
          <Button css={{ padding: `16px` }}>Go back to the homepage.</Button>
        </a>
      </Link>
    </article>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: `404`,
      },
    },
  };
};
