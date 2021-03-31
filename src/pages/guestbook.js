/** @jsx jsx */
import { jsx, Box, Button } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import GuestList from '../components/joy/guestlist';

import ClientOnly from '../components/joy/clientOnly';

import { useAuth } from '../hooks/use-auth';

// markup

export default function Guestbook() {
  const { login, logout, currentUser } = useAuth();
  const user = currentUser();
  const userAddress = user?.get('ethAddress');

  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        {user ? (
          <>
            ETH Address: {userAddress}
            <br />
            <br />
            <Button
              onClick={() => {
                return logout().catch((e) => {
                  console.error(e);
                });
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            onClick={() => {
              return login().catch((e) => {
                console.error(e);
              });
            }}
          >
            Login
          </Button>
        )}
        <br />
        <br />
        guest list
        <br />
        <br />
        <ClientOnly>
          <GuestList />
        </ClientOnly>
      </Box>
    </Layout>
  );
}
