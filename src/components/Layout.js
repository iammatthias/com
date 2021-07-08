/** @jsx jsx */
import { jsx } from 'theme-ui';
import { lighten, darken } from '@theme-ui/color';
import ColorToggle from './colorToggle';
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

          height: 'calc(100vh - 8rem)',
          display: 'grid',
          gridTemplateAreas: ['"nav" "body" "body"', '"body body nav"'],
          gridTemplateRows: ['auto 1fr', '1fr'],
          gridTemplateColumns: ['1fr', '1fr auto'],
          gridGap: '1rem',
        }}
      >
        <section
          sx={{
            p: ['0 .5rem', '.5rem 0'],
            gridArea: 'nav',
            writingMode: ['', 'vertical-rl'],
            bg: [darken('background', 0.025), 'transparent'],
          }}
        >
          <ColorToggle />
        </section>
        <section
          sx={{
            p: '.5rem',
            gridArea: 'body',
            bg: lighten('background', 0.025),
          }}
        >
          {children}
        </section>
      </main>
    </MoralisProvider>
  );
}
