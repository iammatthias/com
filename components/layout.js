/** @jsxImportSource theme-ui */
// layout

import { Box } from 'theme-ui'
import Headroom from 'react-headroom'
import Nav from './nav'
import MobileOnly from './mobileOnly'
import DesktopOnly from './desktopOnly'
import Gradient from '../components/bgGradient'
import ClientOnly from '../components/clientOnly'

export default function Layout({ children }) {
  return (
    <>
      <Box
        sx={{
          width: '100%;',
          maxWidth: ['100%', '', '80vw'],
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
        <Box
          sx={{
            borderRadius: '4px',
            gridArea: 'body',
            position: 'relative',
            p: [3, 3, 4],
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: '-10',
              boxShadow: 'frame',
            },
          }}
        >
          {children}
        </Box>
      </Box>
      <ClientOnly>
        <Gradient />
      </ClientOnly>
    </>
  )
}
