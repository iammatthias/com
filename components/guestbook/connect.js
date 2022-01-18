/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { Button, Box } from 'theme-ui'

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
    <Box sx={{ mb: 4 }}>
      {connectors.map(x => (
        <Button
          disabled={isMounted && !x.ready}
          key={x.name}
          onClick={() => connect(x)}
          sx={{ mb: 2, mr: 4 }}
        >
          {x.id === 'injected' ? (isMounted ? x.name : x.id) : x.name}
          {isMounted && !x.ready && ' (unsupported)'}
          {loading && x.name === connector?.name && '…'}
        </Button>
      ))}
      {error && <p>{error?.message ?? 'Failed to connect'}</p>}
    </Box>
  )
}
