/** @jsxImportSource theme-ui */

// guestbook cta

import { Button } from 'theme-ui'
import Sparkle from './sparkle'
import { GuestbookAuth } from '../lib/utils/guestbookAuth'

export default function GuestbookCTA({ props }) {
  const { login } = GuestbookAuth()

  async function GuestAuth() {
    return login().catch(e => {
      console.error(e)
    })
  }
  return (
    <Button sx={{ p: ['8px 12px'] }} onClick={GuestAuth}>
      <Sparkle>
        <span
          sx={{
            display: 'inline-block',
            lineHeight: '4px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Sign the Web3 Guestbook
        </span>
      </Sparkle>
    </Button>
  )
}
