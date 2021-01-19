import React from 'react';

import { Text } from 'theme-ui';

import Link from './joy/link';

const Menu = (props) => {
  return (
    <Text as="h4">
      <Link href="/photography/">Photography</Link>{' '}
      <Link href="/blog/">Blog</Link>
      {'  '}
      <Link href="/about/">About</Link>
    </Text>
  );
};

export default Menu;
