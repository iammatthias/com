/** @jsxImportSource theme-ui */

import { MDXRemote } from 'next-mdx-remote'
import { Box } from 'theme-ui'

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
          <p>hello, guest</p>
        </article>
      </Box>
    </Box>
  )
}