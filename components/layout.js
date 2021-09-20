/** @jsxImportSource theme-ui */
// components/layout.js

import { Box } from 'theme-ui'
import Nav from './nav'

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateAreas: ['"nav" "body" "body"', '', '"body body nav"'],
        gridTemplateRows: ['auto 1fr', '', '1fr'],
        gridTemplateColumns: ['1fr', '', '1fr auto'],
        gridGap: [0, '', 3],
        width: '100%;',
        maxWidth: ['100%', '', '80vw'],
        mx: 'auto',
      }}
    >
      <Nav />

      {children}
    </Box>
  )
}
