/** @jsxImportSource theme-ui */
// layout

import { Box } from 'theme-ui'
import Headroom from 'react-headroom'
import Nav from './nav'
import MobileOnly from './helpers/mobileOnly'
import DesktopOnly from './helpers/desktopOnly'
import ClientOnly from './helpers/clientOnly'
import Gradient from './joy/bgGradient'

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        width: '100%;',
      }}
    >
      <Box
        sx={{
          borderRadius: '4px',
          gridArea: 'body',
          position: 'relative',
          p: [3, 3, 4],
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
      <ClientOnly>
        <Gradient />
      </ClientOnly>
    </Box>
  )
}
