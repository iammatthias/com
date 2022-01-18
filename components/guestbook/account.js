/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useAccount } from 'wagmi'

export default function Connected() {
  const [{ data: accountData }, disconnect] = useAccount({
    fetchEns: true,
  })

  if (!accountData) return <Box>No account connected</Box>

  return (
    <Box>
      <Box>
        <Button onClick={() => disconnect()}>
          Disconnect from {accountData?.connector?.name}
        </Button>
      </Box>
      <Box>
        <p>
          posting as{' '}
          <a
            href={
              process.env.NEXT_PUBLIC_ETHERSCAN_URL +
              '/address/' +
              accountData.address
            }
          >
            {accountData?.ens?.name ?? accountData?.address}
          </a>
        </p>
      </Box>
    </Box>
  )
}
