/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useConnect } from 'wagmi'

export default function Connect() {
  const [{ data, error, loading }, connect] = useConnect()

  return (
    <>
      {data.connectors.map(x => (
        <Button key={x.name} onClick={() => connect(x)} sx={{ mr: 4, mb: 2 }}>
          {x.name}
        </Button>
      ))}
      {error && (
        <Box sx={{ mb: 2 }}>
          <p>{error?.message ?? 'Failed to connect'}</p>
        </Box>
      )}
    </>
  )
}
