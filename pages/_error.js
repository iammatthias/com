/** @jsxImportSource theme-ui */

import { Box } from 'theme-ui'
import Link from 'next/link'

export default function Home() {
  return (
    <Box
      sx={{
        bg: 'background',
        boxShadow: 'card',
        borderRadius: '4px',
        gridArea: 'body',
      }}
    >
      <Box sx={{ p: [3, 3, 4] }}>
        <article>
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
        title: 'Error',
      },
    },
  }
}
