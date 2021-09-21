/** @jsxImportSource theme-ui */

import { Box } from 'theme-ui'
import { MoralisProvider } from 'react-moralis'
import GuestbookCTA from '../components/guestbookCTA'
import GuestbookList from '../components/guestbookList'

export default function Home() {
  return (
    <MoralisProvider
      appId={process.env.NEXT_PUBLIC_MORALIS_APPLICATION_ID}
      serverUrl={process.env.NEXT_PUBLIC_MORALIS_SERVER_ID}
    >
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
            <GuestbookCTA />
            <br />
            <GuestbookList />
          </article>
        </Box>
      </Box>
    </MoralisProvider>
  )
}
