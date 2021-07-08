/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';

import { GuestbookAuth } from '../hooks/guestbook-auth';

export default function GuestSign() {
  const { login } = GuestbookAuth();

  async function GuestAuth() {
    return login().catch((e) => {
      console.error(e);
    });
  }

  return (
    <button sx={{ p: ['8px 12px'] }} onClick={GuestAuth}>
      <span
        sx={{
          display: 'inline-block',
          lineHeight: '4px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        Click Me!
      </span>
    </button>
  );
}
