/** @jsxImportSource theme-ui */
// layout

import { Box } from 'theme-ui'
import Nav from './nav'
import Gradient from './joy/bgGradient'

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        width: '100%;',
        display: 'grid',
        gridTemplateColumns: 'repeat(9,1fr)',
        gridTemplateRows: 'auto',
        gridGap: '2rem',
        padding: '24px 16px',
        '> *': { gridGap: '2rem' },

        '.nav, .pageHeader, .pageFooter, .theGuestBook, .guests': {
          gridColumn: ['1 / 10', '2 / 9', '3 / 8', '4 / 7'],
        },
        '.nav': {
          gridRow: '1',
        },
        '.pageHeader': {
          gridRow: '2',
        },
        '.theGuestBook': {
          // rules for parent grid
          gridRow: '2',
        },
        '.guests': {
          // rules for parent grid
          gridRow: '3',
        },
        article: {
          // rules for parent grid
          gridColumn: '1 / 10',
          gridRow: '3',
          // rules for inner grid
          display: 'grid',
          gridTemplateColumns: 'repeat(9,1fr)',
          gridTemplateRows: 'auto',

          '> *': { gridColumn: ['1 / 10', '2 / 9', '3 / 8', '4 / 7'] },
          '.gallery': {
            // rules for inner grid
            display: 'grid',
            gridTemplateColumns: 'repeat(9,1fr)',
            gridTemplateRows: 'auto',
            gridColumn: '1 / 10',
            h2: {
              gridColumn: ['1 / 10', '2 / 9', '3 / 8', '4 / 7'],
            },
            div: {
              gridColumn: '1 / 10',
            },
          },
          '.sBleed': { gridColumn: ['1 / 10', '2 / 9', '3 / 8', null] },
          '.mBleed': { gridColumn: ['1 / 10', '2 / 9', null, null] },
          '.lBleed': { gridColumn: '1 / 10' },
        },
        '.pageFooter': {
          gridRow: '4',
        },
      }}
    >
      <Nav />
      {children}
      <Gradient />
    </Box>
  )
}
