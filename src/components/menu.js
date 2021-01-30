import React from 'react';

import { Text } from 'theme-ui';

import Link from './joy/link';

import Sparkle from './joy/sparkle';

const Menu = (props) => {
  return (
    <Text as="h4" {...props}>
      <Sparkle>
        <Link
          href="https://iammatthias.com/photography/"
          sx={{ textDecoration: 'none' }}
        >
          Photography
        </Link>
        &nbsp;&nbsp;&nbsp;
        <Link
          href="https://iammatthias.com/blog/"
          sx={{ textDecoration: 'none' }}
        >
          Blog
        </Link>
        &nbsp;&nbsp;&nbsp;
        <Link
          href="https://iammatthias.com/about/"
          sx={{ textDecoration: 'none' }}
        >
          About
        </Link>
      </Sparkle>
    </Text>
  );
};

export default Menu;
