/** @jsxImportSource theme-ui */
import { Button, Box, Alert } from 'theme-ui'

import { useRef, useState, useMemo } from 'react'
import { verifyMessage } from 'ethers/lib/utils'
import { useSignMessage, useAccount } from 'wagmi'

import Ens from './ens'
import Squiggle from '../joy/squiggle'
import Sparkle from '../joy/sparkle'

// dynamic imports
import dynamic from 'next/dynamic'
const Write = dynamic(() => import('./write'))

export default function SignMessage() {
  // account data, fetch ENS
  const [{ data: accountData }, disconnect] = useAccount({
    fetchEns: true,
  })

  // store message for preview
  const previousMessage = useRef
  const [message, setMessage] = useState('')
  const [
    { data: signData, error: signError, loading: signLoading },
    signMessage,
  ] = useSignMessage()

  // store user for preview
  const recoveredAddress = useMemo(() => {
    if (!signData || !previousMessage.current) return undefined
    return verifyMessage(previousMessage.current, signData)
  }, [signData, previousMessage])

  return (
    // conditionally display form or preview of message
    <>
      {signData ? (
        // preview
        <>
          <Box
            sx={{
              mb: 3,
              wordBreak: 'break-word',
            }}
          >
            <Sparkle>
              <p sx={{ m: 0, mb: 1 }}>
                <small>
                  <b>preview:</b>
                </small>
              </p>
              <p sx={{ m: 0, mb: 1 }}>
                <a
                  href={
                    process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                    '/address/' +
                    recoveredAddress
                  }
                >
                  <Ens address={recoveredAddress} />
                </a>
              </p>
              <p sx={{ m: 0, mb: 1 }}>{previousMessage.current}</p>
              <Squiggle
                sx={{
                  mb: 0,
                }}
              />
            </Sparkle>
          </Box>
          <Write message={previousMessage.current} />
        </>
      ) : (
        // message submission form
        <form
          onSubmit={event => {
            event.preventDefault()
            previousMessage.current = message
            signMessage({ message })
          }}
          sx={{ mb: 3, width: ['100%', '80%', '60%'], minWidth: '250px' }}
        >
          <input
            id="message"
            placeholder="gm"
            onChange={event => setMessage(event.target.value)}
            sx={{
              width: '100%',
              padding: 2,
              border: 'solid 1px',
              borderColor: 'text',
              borderRadius: '4px',
              color: 'text',
              bg: 'transparent',
              display: 'block',
              mb: 3,
            }}
          />

          <Button
            disabled={signLoading || !message.length}
            sx={{ mr: 4, mb: 3 }}
          >
            {signLoading ? 'Check Wallet' : 'Sign Message'}
          </Button>

          {signError && (
            <Alert>{signError?.message ?? 'Error signing message'}</Alert>
          )}
        </form>
      )}
    </>
  )
}
