/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Sparkle from '../joy/sparkle'

// email

export default function GuestbookCapture({ props }) {
  return (
    <Box
      sx={{
        position: 'relative',
        p: [3, 3, 4],
        height: 'fit-content',
        borderRadius: '4px',
        display: 'grid',
        gridTemplateRows: ['auto 1fr'],
        gridTemplateColumns: ['1fr'],
        gridGap: '1rem',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <h5 sx={{ m: 0, mb: 2, p: 0 }}>The Guestbook</h5>
        <p sx={{ m: 0, mb: 2, p: 0 }}>Sign the guestbook, get an NFT.</p>
        <Link href="/guestbook">
          <Button title="Guestbook" sx={{ width: 'fit-content' }}>
            <Sparkle>Guestbook</Sparkle>
          </Button>
        </Link>
      </Box>
    </Box>
  )
}
