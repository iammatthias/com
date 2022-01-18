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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: ['1fr', '1fr', '1fr 1fr'],
        gridGap: 4,
      }}
    >
      <Box>
        <p sx={{ m: 0, mb: 4 }}>
          write a message on the blockchain<sup>1</sup> and get an nft
          <sup>2</sup>
        </p>
        {accountData?.address ? (
          <>
            <Account />
            <SignMessage />
          </>
        ) : (
          <Connect />
        )}
        <p sx={{ m: 0, mb: 4 }}>
          <small>
            <sup>1</sup> contract:{' '}
            <a
              href={
                process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                '/address/' +
                process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
              }
            >
              {process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS}
            </a>
            <br />
            <sup>2</sup> [9999] guests available. free to mint, wallet holder
            pays gas. max 3 guests per wallet
            <br />☞ missed the nfts? you can still write your message on the
            blockchain
          </small>
        </p>
      </Box>
      <Guests />
    </Box>
  )
}
