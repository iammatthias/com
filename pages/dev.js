/** @jsxImportSource theme-ui */

import { Box } from 'theme-ui'
import Squiggle from '../components/squiggle'
import Spicy from '../components/spicy'
import Sparkle from '../components/sparkle'
import MobileOnly from '../components/mobileOnly'
import EmailCapture from '../components/emailCapture'
import GuestbookCapture from '../components/guestbookCapture'
import Gradient from '../components/bgGradient'
import ClientOnly from '../components/clientOnly'

export default function Home() {
  return (
    <>
      <Box
        sx={{
          zIndex: '1',
          borderRadius: '4px',
          gridArea: 'body',
          position: 'relative',
        }}
      >
        <article>
          <h1>I am Matthias</h1>
          <p>Just a dude with a camera and a dream.</p>
          <p>
            Based in Long Beach, California, with my wife and daughter.
            Currently at Tornado. I have previously worked with interesting
            teams at Aspiration, Surf Air and General Assembly.
          </p>
        </article>
      </Box>
      <ClientOnly>
        <Gradient />
      </ClientOnly>
    </>
  )
}

//////////////// PAGE CONTENT /////////////////////

export async function getStaticProps() {
  return {
    props: {
      metadata: {
        title: 'Test Page',
      },
    },
  }
}
