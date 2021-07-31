/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react'; //eslint-disable-line
import { lighten } from '@theme-ui/color';

import Nav from './nav';
import Sparkle from './sparkle';

export default function Layout({ children }) {
  return (
    <div>
      <div sx={{ bg: 'accent', padding: '1rem', textAlign: 'center' }}>
        <Sparkle>🚧 In case of render bugs, please refresh. 🚧</Sparkle>
      </div>
      <main
        sx={{
          bg: 'background',
          m: ['2rem 1rem', '4rem'],
          minHeight: 'calc(100vh - 8rem)',
          display: 'grid',
          gridTemplateAreas: ['"nav" "body" "body"', '"body body nav"'],
          gridTemplateRows: ['auto 1fr', '1fr'],
          gridTemplateColumns: ['1fr', '1fr auto'],
          gridGap: '1rem',
        }}
      >
        <Nav />
        <section
          sx={{
            gridArea: 'body',
            bg: lighten('background', 0.015),
            borderRadius: '4px',
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}
