/** @jsx jsx */
import { jsx } from 'theme-ui';
import { lighten } from '@theme-ui/color';
import { MoralisProvider } from 'react-moralis';

import Nav from './nav';

export default function Layout({ children }) {
  return (
    <MoralisProvider
      appId={process.env.GATSBY_MORALIS_APPLICATION_ID}
      serverUrl={process.env.GATSBY_MORALIS_SERVER_ID}
    >
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
    </MoralisProvider>
  );
}
