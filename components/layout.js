/** @jsxImportSource theme-ui */
// layout

import { Box } from 'theme-ui'
import Headroom from 'react-headroom'
import Nav from './nav'
import MobileOnly from './mobileOnly'
import DesktopOnly from './desktopOnly'

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateAreas: ['"nav" "body" "body"', '', '"body body nav"'],
        gridTemplateRows: ['auto 1fr', '', '1fr'],
        gridTemplateColumns: ['1fr', '', '1fr auto'],
        gridGap: [3, 3, 4],
        width: '100%;',
        maxWidth: ['100%', '', '80vw'],
        mx: 'auto',
      }}
    >
      <DesktopOnly>
        <Nav />
      </DesktopOnly>
      <MobileOnly>
        <Headroom>
          <Nav />
        </Headroom>
      </MobileOnly>
      {children}
    </Box>
  )
}
