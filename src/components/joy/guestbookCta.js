/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Button } from 'theme-ui';
import Sparkle from './sparkle';
import { useAuth } from '../../hooks/use-auth';

export default function GuestSign() {
  const { login } = useAuth();

  async function sign() {
    return login().catch((e) => {
      console.error(e);
    });
  }

  return (
    <Button onClick={sign}>
      <Sparkle>Sign the web3 Guestbook</Sparkle>
    </Button>
  );
}
