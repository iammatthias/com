/** @jsx jsx */
import { jsx, Box, Button } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import usePromise from 'react-promise';

import Layout from '../components/Layout';

import { useAuth } from '../hooks/use-auth';

// markup

export default function Guestbook() {
  const { login, logout, currentUser, guestbookLog } = useAuth();
  const user = currentUser();
  const userAddress = user?.get('ethAddress');

  const guests = guestbookLog();

  const guestList = guests?.then();

  console.log(guestList);

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
      </Box>
    </Layout>
  );
}
