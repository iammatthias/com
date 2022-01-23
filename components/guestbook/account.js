/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'

import { useAccount, useNetwork } from 'wagmi'

export default function Connected() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
  const [{ data: accountData }, disconnect] = useAccount({
    fetchEns: true,
  })

  // get current network
  const [{ data }, switchNetwork] = useNetwork()

  if (!accountData) return <Box>No account connected</Box>

  return (
    <Box>
      <Box>
        <Button onClick={() => disconnect()} sx={{ mb: 3 }}>
          Disconnect from {accountData?.connector?.name}
        </Button>
      </Box>
      <Box>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'text',
            borderRadius: '4px',
            mb: 3,
            padding: 2,

            wordBreak: 'break-word',
          }}
        >
          <p sx={{ m: 0, mb: 1 }}>
            <small>
              connected as{' '}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  '/address/' +
                  accountData.address
                }
                target="_blank"
                rel="noreferrer"
              >
                {accountData?.ens?.name ?? accountData?.address}
              </a>
            </small>
          </p>
          <p sx={{ m: 0, mb: 1 }}>
            <small>
              contract:{' '}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  '/address/' +
                  contractAddress
                }
                target="_blank"
                rel="noreferrer"
              >
                {contractAddress}
              </a>
            </small>
          </p>

          <p sx={{ m: 0 }}>
            <small>
              network: {data.chain?.name ?? networkData.chain?.id}{' '}
              {data.chain?.unsupported && '(unsupported)'}
            </small>
          </p>
        </Box>
      </Box>
    </Box>
  )
}
