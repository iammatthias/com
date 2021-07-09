/** @jsx jsx */
import { jsx } from 'theme-ui';
import { lighten } from '@theme-ui/color';
import Nav from './nav';
import Seo from './seo';
const { MoralisProvider } = require('react-moralis');

export default function Layout({ children }) {
  return (
    <MoralisProvider
      appId={process.env.GATSBY_MORALIS_APPLICATION_ID}
      serverUrl={process.env.GATSBY_MORALIS_SERVER_ID}
    >
      <main
        sx={{
          bg: 'background',
          m: ['1rem', '4rem'],
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
            p: ['.5rem', '2rem'],
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
