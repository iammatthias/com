/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { darken } from '@theme-ui/color';
import ColorToggle from './colorToggle';
import Link from './link';
import Logo from './logo';

export default function Nav() {
  return (
    <nav
      sx={{
        display: 'grid',
        gridArea: 'nav',
        gridTemplateAreas: [
          '"logo toggle" "menu menu"',
          '"logo" "menu" "toggle"',
        ],
        gridTemplateRows: ['1fr 2fr', 'auto auto 1fr'],
        gridTemplateColumns: ['1fr 1fr', '1fr'],
      }}
    >
      <Box
        sx={{
          gridArea: 'logo',
          mb: ['0rem', '2rem'],
          textAlign: ['left', 'center'],
        }}
      >
        <Logo sx={{ m: ['0 1rem 0 0', '0 auto 1rem auto'] }} />
      </Box>
      <Box
        sx={{
          gridArea: 'menu',
          mb: ['0rem', '2rem'],
          padding: '1rem',
          bg: [darken('background', 0.025)],
          borderRadius: '4px',
          height: 'fit-content',
          flexGrow: ['1', '0'],
          justifyContent: 'center',
          alignContent: 'center',
          textAlign: 'center',
          '> p': {
            display: ['inline-block', 'block'],
            writingMode: ['', 'vertical-rl'],
            lineHeight: ['3', '.35'],
            pb: '0',
          },
        }}
      >
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="/" sx={{ textDecoration: 'none' }}>
            home
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="/photography" sx={{ textDecoration: 'none' }}>
            work
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="/blog" sx={{ textDecoration: 'none' }}>
            blog
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="/about" sx={{ textDecoration: 'none' }}>
            about
          </Link>
        </p>
        <p
          sx={{
            m: ['0 0 0 0', '0 0 0 0'],
            p: '0',
          }}
        >
          <Link href="/guestbook" sx={{ textDecoration: 'none' }}>
            guestbook
          </Link>
        </p>
      </Box>
      <Box
        sx={{
          gridArea: 'toggle',
          '> label': {
            display: 'flex',
            justifyContent: 'flex-end',
          },
        }}
      >
        <ColorToggle />
      </Box>
    </nav>
  );
}
