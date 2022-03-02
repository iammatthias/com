import { useRef, useState, useMemo } from 'react'
import { verifyMessage } from 'ethers/lib/utils'
import { useSignMessage } from 'wagmi'

import { styled } from '@/lib/stitches.config'
import Box from '@/components/primitives/box'
import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Anchor from '@/components/primitives/text/Anchor'

import Ens from './ens'
import Squiggle from '../squiggle'
import Sparkle from '../sparkle'
import WriteMessage from './writeMessage'

// dynamic imports
// import dynamic from 'next/dynamic'
// const Write = dynamic(() => import('./write'))

export default function SignMessage() {
  // store message for preview

  const previousMessage: any = useRef
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
            css={{
              margin: '0 0 16x',
              wordBreak: 'break-word',
            }}
          >
            <Sparkle>
              <P css={{ margin: '0 0 8px' }}>
                <small>
                  <b>preview:</b>
                </small>
              </P>
              <P css={{ margin: '0 0 8px' }}>
                <Small>
                  <Anchor
                    href={
                      process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                      'address/' +
                      recoveredAddress
                    }
                  >
                    <Ens address={recoveredAddress} />
                  </Anchor>
                </Small>
              </P>
              <P css={{ margin: '0 0 8px' }}>{previousMessage.current}</P>
              <Squiggle />
            </Sparkle>
          </Box>
          <WriteMessage message={previousMessage.current} />
        </>
      ) : (
        // message submission form
        <form
          onSubmit={event => {
            event.preventDefault()
            previousMessage.current = message
            signMessage({ message })
          }}
          style={{ width: '100%' }}
        >
          <P>Sign your message to preview.</P>
          <input
            id="message"
            placeholder="gm"
            onChange={event => setMessage(event.target.value)}
            style={{
              padding: '8px',
              border: 'solid 1px',
              borderColor: 'text',
              borderRadius: '4px',
              color: 'text',
              background: 'transparent',
              display: 'block',
              margin: '0 0 16px',
              maxWidth: '361px',
              width: 'calc(100% - 16px)',
            }}
          />
          {signLoading ? (
            <P>Check Wallet</P>
          ) : (
            <Button
              disabled={signLoading || !message.length}
              css={{ margin: '0 16px 16px 0' }}
            >
              Sign Message
            </Button>
          )}

          {signError && <P>{signError?.message ?? 'Error signing message'}</P>}
        </form>
      )}
    </>
  )
}
