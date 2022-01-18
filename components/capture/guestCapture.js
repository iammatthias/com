/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'
import EmailCapture from './emailCapture'
import GuestbookCapture from './guestbookCapture'

// capture

export default function GuestCapture({ props }) {
  return (
    <Box
      id="emailCapture"
      sx={{
        position: 'relative',
        p: [3, 3, 4],
        height: 'fit-content',
        borderRadius: '4px',
        boxShadow: 'card',
        display: 'grid',
        gridTemplateRows: ['auto 1fr', '1fr'],
        gridTemplateColumns: ['1fr', '1fr 1fr'],
        gridGap: '1rem',
      }}
    >
      <GuestbookCapture />
      <EmailCapture />
    </Box>
  )
}
