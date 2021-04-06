import React from 'react';

import { Text } from 'theme-ui';

import Link from './joy/link';

const Menu = (props) => {
  return (
    <Text
      as="h4"
      {...props}
      sx={{ width: '100%', wordWrap: 'break-word', hyphens: 'none' }}
    >
      <Link
        href="https://iammatthias.com/photography/"
        sx={{ textDecoration: 'none', m: ['0 1rem 0', '0 0 1rem'] }}
      >
        Photography
      </Link>{' '}
      <Link
        href="https://iammatthias.com/blog/"
        sx={{ textDecoration: 'none', m: ['0 1rem 0', '0 0 1rem'] }}
      >
        Blog
      </Link>{' '}
      <Link
        href="https://iammatthias.com/about/"
        sx={{ textDecoration: 'none', m: ['0 1rem 0', '0 0 1rem'] }}
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
