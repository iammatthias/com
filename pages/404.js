/** @jsxImportSource theme-ui */

import { Box } from 'theme-ui'
import Link from 'next/link'
import Squiggle from '../components/squiggle'

export default function Custom404Page(props) {
  return (
    <Box
      sx={{
        backgroundImage: theme =>
          `linear-gradient(to bottom, ${theme.colors.background}, ${theme.colors.backgroundTint})`,
        borderRadius: '4px',
        gridArea: 'body',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          zIndex: '-10',
          boxShadow: 'frame',
        },
      }}
    >
      <Box sx={{ p: [3, 3, 4] }}>
        <article>
          <Box sx={{ width: 'fit-content' }}>
            <h1>{props.metadata.title}</h1>
            <br />
            <Squiggle />
            <br />
          </Box>
          You don't have to go <Link href="/">home</Link>, but you can't stay
          here.
        </article>
      </Box>
    </Box>
  )
}

//////////////// PAGE CONTENT /////////////////////

export async function getStaticProps() {
  return {
    props: {
      metadata: {
        title: '404',
      },
    },
  }
}
