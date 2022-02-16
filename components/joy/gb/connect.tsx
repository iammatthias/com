import { useState, useEffect } from 'react'
import Box from '@/components/primitives/box'
import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'

import { useConnect } from 'wagmi'

export default function Connect() {
  const useIsMounted = () => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    return mounted
  }

  const isMounted = useIsMounted()

  const [
    {
      data: { connector, connectors },
      error,
      loading,
    },
    connect,
  ] = useConnect()

  return (
    <Box>
      {connectors.map(x => (
        <Button
          disabled={isMounted && !x.ready}
          key={x.name}
          onClick={() => connect(x)}
          css={{ margin: '0 16px 16px 0' }}
        >
          {x.id === 'injected' ? (isMounted ? x.name : x.id) : x.name}
          {isMounted && !x.ready && ' (unsupported)'}
          {loading && x.name === connector?.name && '…'}
        </Button>
      ))}
      {error && (
        <P css={{ margin: '0 0 16px' }}>
          {error?.message ?? 'Failed to connect'}
        </P>
      )}
    </Box>
  )
}
