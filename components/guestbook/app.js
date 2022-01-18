/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useAccount } from 'wagmi'

// dynamic imports

import dynamic from 'next/dynamic'
const Connect = dynamic(() => import('./connect'))

const SignMessage = dynamic(() => import('./signMessage'))

export default function App() {
  const [{ data }, disconnect] = useAccount()

  return data ? (
    <>
      <SignMessage />
      <Button onClick={disconnect} sx={{ mr: 4, mb: 4 }}>
        Disconnect from {data?.connector?.name}
      </Button>
    </>
  ) : (
    <Connect />
  )
}
