/** @jsx jsx */
import { jsx, Box, Button } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import Layout from '../components/Layout';

import { useAuth } from '../hooks/use-auth';

// markup

export default function Guestbook() {
  const { login } = useAuth();
  return (
    <Layout wrapped>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <Button
          onClick={() => {
            return login().catch((e) => {
              console.error(e);
            });
          }}
        >
          Login
        </Button>
      </Box>
    </Layout>
  );
}
