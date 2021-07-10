/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Button } from 'theme-ui';

import { GuestbookAuth } from '../hooks/guestbook-auth';

import Sparkle from './sparkle';

export default function GuestSign() {
  const { login } = GuestbookAuth();

  async function GuestAuth() {
    return login().catch((e) => {
      console.error(e);
    });
  }

  return (
    <Button sx={{ p: ['8px 12px'] }} onClick={GuestAuth}>
      <Sparkle>
        <span
          sx={{
            display: 'inline-block',
            lineHeight: '4px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Sign the Web3 Guestbook
        </span>
      </Sparkle>
    </Button>
  );
}
