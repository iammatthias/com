/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useAccount } from 'wagmi'

// // dynamic imports
import dynamic from 'next/dynamic'
const Connect = dynamic(() => import('./connect'))
const Account = dynamic(() => import('./account'))

const SignMessage = dynamic(() => import('./signMessage'))

export default function TheGuestBook() {
  const [{ data: accountData }] = useAccount()

  return (
    <Box className="theGuestBook">
      {accountData?.address ? <Account /> : <Connect />}
      <p sx={{ m: 0, mb: 1 }}>write a message on the blockchain*</p>
      <p sx={{ m: 0, mb: 3 }}>
        <small>*contract runs on Polygon, nominal gas fee applies ✌️</small>
      </p>
      {accountData?.address && <SignMessage />}
    </Box>
  )
}
