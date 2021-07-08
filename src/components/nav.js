/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { darken } from '@theme-ui/color';
import { useMoralisCloudFunction } from 'react-moralis';
import ColorToggle from './ColorToggle';
import Link from './link';

export default function Nav() {
  const { data } = useMoralisCloudFunction('getUserList', {});
  console.log(data);

  return (
    <section
      sx={{
        gridArea: 'nav',
        display: 'flex',
        flexDirection: ['row', 'column'],
      }}
    >
      <Box
        sx={{
          mb: ['0', '1rem'],
          mr: ['1rem', '0'],
          padding: '1rem',
          bg: [darken('background', 0.025)],
          borderRadius: '4px',
          height: 'auto',
          flexGrow: ['1', '0'],
          justifyContent: 'center',
          alignContent: 'center',
          '> p': {
            display: ['inline-block', 'block'],
            writingMode: ['', 'vertical-rl'],
            lineHeight: '.35',
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
          }}
        >
          <Link href="#" sx={{ textDecoration: 'none' }}>
            guestbook
          </Link>
        </p>
      </Box>
      <Box
        sx={{
          py: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
        }}
      >
        <ColorToggle />
      </Box>
    </section>
  );
}
