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
    <Box css={{ margin: '0 0 16px' }}>
      {connectors.map(
        connector =>
          connector.ready && (
            <Button key={connector.id} onClick={() => connect(connector)}>
              {connector.name}
            </Button>
          ),
      )}
      {error && <P>{error?.message ?? 'Failed to connect'}</P>}
    </Box>
  )
}
