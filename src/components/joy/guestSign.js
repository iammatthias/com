/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Button } from 'theme-ui';
import Sparkle from './sparkle';
import detectEthereumProvider from '@metamask/detect-provider';
import { useAuth } from '../../hooks/use-auth';

export default function GuestSign() {
  const { login } = useAuth();

  function notEth() {
    alert('needs web3');
  }

  async function sign() {
    const provider = await detectEthereumProvider();
    if (provider) {
      return login().catch((e) => {
        console.error(e);
      });
    } else {
      return notEth();
    }
  }

  return (
    <Button onClick={sign}>
      <Sparkle>Sign the Guestbook</Sparkle>
    </Button>
  );
}
