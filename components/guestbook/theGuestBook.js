/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useAccount } from 'wagmi'

// // dynamic imports
import dynamic from 'next/dynamic'
const Connect = dynamic(() => import('./connect'))
const Account = dynamic(() => import('./account'))
const Guests = dynamic(() => import('./guests'))
const SignMessage = dynamic(() => import('./signMessage'))

export default function TheGuestBook() {
  const [{ data: accountData }] = useAccount()

  return (
    <Box className="theGuestBook">
      <Box>
        {accountData?.address ? <Account /> : <Connect />}
        <p sx={{ m: 0, mb: 3 }}>write a message on the blockchain*</p>
        {accountData?.address && <SignMessage />}
        <p sx={{ m: 0, mb: 3 }}>
          <small>
            *contract on rinkeby:{' '}
            <a
              href={
                process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                '/address/' +
                process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
              }
            >
              {process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS}
            </a>
            <br />☞ nominal gas fee to write message on chain ✌️
          </small>
        </p>
      </Box>
      <Guests />
    </Box>
  )
}
