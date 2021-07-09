/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { darken } from '@theme-ui/color';
import { useMoralisCloudFunction } from 'react-moralis';
import ColorToggle from './ColorToggle';
import Link from './link';
import Logo from './logo';

export default function Nav() {
  const { data } = useMoralisCloudFunction('getUserList', {});
  console.log(data);

  return (
    <section
      sx={{
        display: 'grid',
        gridArea: 'nav',
        gridTemplateAreas: [
          '"logo toggle" "menu menu"',
          '"logo" "menu" "toggle"',
        ],
        gridTemplateRows: ['1fr 1fr', 'auto 1fr 1fr'],
        gridTemplateColumns: ['1fr 1fr', '1fr'],
      }}
    >
      <Box
        sx={{
          gridArea: 'logo',
          py: '1rem',
        }}
      >
        <Logo sx={{ mb: ['0', '1rem'], mr: ['1rem', '0'] }} />
      </Box>
      <Box
        sx={{
          gridArea: 'menu',
          mb: ['0', '1rem'],

          padding: '1rem',
          bg: [darken('background', 0.025)],
          borderRadius: '4px',
          height: 'auto',
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
          <Link href="#" sx={{ textDecoration: 'none' }}>
            home
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="#" sx={{ textDecoration: 'none' }}>
            work
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="#" sx={{ textDecoration: 'none' }}>
            blog
          </Link>
        </p>
        <p
          sx={{
            m: ['0 1rem 0 0', '0 0 1rem 0'],
          }}
        >
          <Link href="#" sx={{ textDecoration: 'none' }}>
            about
          </Link>
        </p>
        <p
          sx={{
            m: ['0 0 0 0', '0 0 0 0'],
            p: '0',
          }}
        >
          <Link href="#" sx={{ textDecoration: 'none' }}>
            guestbook
          </Link>
        </p>
      </Box>
      <Box
        sx={{
          gridArea: 'toggle',
          py: '1rem',
          '> label': {
            display: 'flex',
            justifyContent: 'flex-end',
          },
        }}
      >
        <ColorToggle />
      </Box>
    </section>
  );
}
