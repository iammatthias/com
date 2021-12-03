/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Sparkle from './sparkle'
import Spicy from './spicy'

// email

export default function GuestbookCapture({ props }) {
  return (
    <Box
      sx={{
        position: 'relative',
        p: [3, 3, 4],
        boxShadow: 'card',
        height: 'fit-content',
        borderRadius: '4px',
      }}
    >
      <h3 sx={{ m: 0 }}>Web3 Guestbook</h3>
      <p>
        Connect with your favorite wallet, and sign the Web3 Guestbook using a
        gasless meta-transaction.
      </p>

      <Link href="/guestbook">
        <Button title="Discuss on Twitter">
          <Sparkle>Guestbook</Sparkle>
        </Button>
      </Link>
    </Box>
  )
}
