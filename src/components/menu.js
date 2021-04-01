import React from 'react';

import { Text } from 'theme-ui';

import Link from './joy/link';

import Sparkle from './joy/sparkle';

const Menu = (props) => {
  return (
    <Text
      as="h4"
      {...props}
      sx={{ width: '100%', wordWrap: 'break-word', hyphens: 'none' }}
    >
      <Link
        href="https://iammatthias.com/photography/"
        sx={{ textDecoration: 'none' }}
      >
        Photography
      </Link>{' '}
      <Link
        href="https://iammatthias.com/blog/"
        sx={{ textDecoration: 'none' }}
      >
        Blog
      </Link>{' '}
      <Link
        href="https://iammatthias.com/about/"
        sx={{ textDecoration: 'none' }}
      >
        About
      </Link>{' '}
      <Link
        href="https://iammatthias.com/guestbook/"
        sx={{ textDecoration: 'none' }}
      >
        Guestbook
      </Link>
    </Text>
  );
};

export default Menu;
