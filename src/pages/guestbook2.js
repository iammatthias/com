/** @jsx jsx */

import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import { useMoralis } from 'react-moralis';

import Layout from '../components/Layout';

import Guestlist from '../components/joy/guestlist';

import ClientOnly from '../components/joy/clientOnly';

import GuestbookCta from '../components/joy/guestbookCta';

import Link from '../components/joy/link';

// markup

export default function Guestbook() {
  const { authenticate, isAuthenticated, user } = useMoralis();
  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => authenticate()}>Authenticate</button>
      </div>
    );
  }
  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <span>bruh, {user.get('username')}</span>
      </Box>
    </Layout>
  );
}
